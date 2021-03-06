import { FC, useState } from "react";
import styled from "styled-components";
import { RuleMatch } from "../common/language-tool-api/types";
import { ApplyReplacementFunction, ResultsArea } from "../common/results-display/ResultsArea";
import { LanguageToolClient } from "../common/language-tool-api/LanguageToolClient";
import { isRunningInOutlook, isRunningInWord } from "../common/office-api-helpers";
import { splitTextMatch } from "../common/splitTextMatch";
import { computeErrorCounts, SummaryBar } from "../common/summary-bar/SummaryBar";
import { UserSettingsStorage, useUserSettingsState } from "../common/user-settings/UserSettingsStorage";
import { FeatureFlagsStorage, useFeatureFlagsState } from "../common/feature-flags/feature-flags";
import { DebugPanel } from "../common/debug-panel/DebugPanel";
import { isFunction } from "../common/type-helpers";
import { AddinTopButtonGroup } from "./AddinTopButtonGroup";
import { UserSettingsAndFeatureFlagsContext } from "../common/UserSettingsAndFeatureFlagsContext";
import { SetState } from "../common/UseState";
import { PilotPhaseBanner } from "../common/PilotPhaseBanner";
import { leftMargin, rightMargin } from "./taskpane-style-constants";
import { ImpressumAndDatenschutzLinks } from "../common/ImpressumAndDatenschutzLinks";

export const TaskpaneApp: FC = () => {
  const [ruleMatches, setRuleMatches] = useState<RuleMatch[] | null>(null);
  const [applier, setApplier] = useState<ApplyReplacementFunction>();
  const [matchSelector, setMatchSelector] = useState<(ruleMatch: RuleMatch) => void>();
  const [isLoading, setLoading] = useState(false);
  const [isError, setError] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  // const [isTextModified, setTextModified] = useState(false); // TODO: figure out how notice text changes in Word
  const [featureFlags, setFeatureFlags] = useFeatureFlagsState();
  const [userSettings, setUserSettings] = useUserSettingsState();

  const errorCounts = computeErrorCounts(ruleMatches || []);

  const checkTextWithLoading = async () => {
    setLoading(true);
    setError(false);
    try {
      await checkText(setRuleMatches, setApplier, setMatchSelector);
    } catch (e) {
      setError(true);
      console.error("Error while checking text: ", e);
    }
    setLoading(false);
  };

  return (
    <AddinContainer>
      <UserSettingsAndFeatureFlagsContext.Provider value={{ userSettings, featureFlags }}>
        <PilotPhaseBannerContainer>
          <PilotPhaseBanner />
        </PilotPhaseBannerContainer>
        <AddinTopButtonGroup
          onCheckClicked={checkTextWithLoading}
          settingsOpenState={[isSettingsOpen, setSettingsOpen]}
        />
        <SummaryBarContainer hidden={isSettingsOpen}>
          <SummaryBar showSummaryBoxes={ruleMatches !== null} {...errorCounts} />
        </SummaryBarContainer>

        <LowerAreaContainer>
          <ResultsArea
            isError={isError}
            isLoading={isLoading}
            isSettingsOpen={isSettingsOpen}
            userSettingsPanelProps={{
              userSettingsState: [userSettings, setUserSettings],
              onConfirmClicked: () => setSettingsOpen(false),
            }}
            ruleMatches={ruleMatches}
            matchesDisabled={false /* isTextModified */}
            applyReplacement={async (m, r) => {
              if (!isFunction(applier)) return;
              await applier(m, r);
              await checkTextWithLoading();
            }}
            selectRuleMatch={matchSelector}
          />
        </LowerAreaContainer>
        <ImpressumAndDatenschutzLinks isAddin />
      </UserSettingsAndFeatureFlagsContext.Provider>
      <DebugPanel
        featureFlagsState={[featureFlags, setFeatureFlags]}
        userSettingsState={[userSettings, setUserSettings]}
      />
    </AddinContainer>
  );
};

const AddinContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const PilotPhaseBannerContainer = styled.div`
  margin: 0 ${rightMargin} 0 ${leftMargin};
`;

const SummaryBarContainer = styled.div`
  margin: 8px ${rightMargin} 0 ${leftMargin};
`;

const LowerAreaContainer = styled.div`
  margin-top: 12px;
  overflow: auto;
  padding-top: 5px;
  box-sizing: border-box;
`;

type ParagraphWithRanges = { paragraph: Word.Paragraph; ranges: Word.Range[] };
type StartOffsetMapItem = { startOffset: number; paragraph: Word.Paragraph; range: Word.Range };

const checkText = async (
  setRuleMatches: SetState<RuleMatch[] | null>,
  setApplier: SetState<ApplyReplacementFunction | undefined>,
  setMatchSelector: SetState<((ruleMatch: RuleMatch) => void) | undefined>
) => {
  if (isRunningInWord()) {
    await checkTextFromWord(setRuleMatches, setApplier, setMatchSelector);
  } else if (isRunningInOutlook()) {
    await outlookClickHandler(setRuleMatches, setApplier);
  } else {
    throw new Error("Unsupported host app");
  }
};

async function checkTextFromWord(
  setRuleMatches: SetState<RuleMatch[] | null>,
  setApplier: SetState<ApplyReplacementFunction | undefined>,
  setMatchSelector: SetState<((ruleMatch: RuleMatch) => void) | undefined>
) {
  console.time("getTextRanges");
  const paragraphsWithRanges: ParagraphWithRanges[] = await Word.run(async (context) => {
    const paragraphs = context.document.body.paragraphs.track().load();
    await context.sync();
    const ranges = paragraphs.items.map((paragraph) => ({
      paragraph,
      rangeCollection: paragraph.getRange(Word.RangeLocation.whole).getTextRanges([" "], false).track().load(),
    }));
    await context.sync();

    const result = ranges.map(({ paragraph, rangeCollection }) => ({
      paragraph,
      ranges: rangeCollection.items.map((r) => r.track()),
    }));
    await context.sync();
    return result;
  });

  const { plaintext, startOffsetMap } = extractPlaintextAndIndexMap(paragraphsWithRanges);

  console.log(`Have plaintext: `, plaintext);
  console.timeEnd("getTextRanges");

  console.time("ltCheck");
  const matches = await LanguageToolClient.check(plaintext, UserSettingsStorage.load(), FeatureFlagsStorage.load());
  setRuleMatches(matches);
  console.timeEnd("ltCheck");

  console.log(startOffsetMap);

  const getRangeForMatch = async (ruleMatch: RuleMatch) => {
    const startOffset = ruleMatch.offset;
    const endOffset = ruleMatch.offset + ruleMatch.length;
    const { index: startRangeIndex, item: startRangeItem } = findItemContainingOffset(startOffsetMap, startOffset);
    const { index: endRangeIndex } = findItemContainingOffset(startOffsetMap, endOffset);
    const startOffsetInStartRange = startOffset - startRangeItem.startOffset;

    const affectedRangesPlaintext = startOffsetMap
      .slice(startRangeIndex, endRangeIndex + 1)
      .map((item) => item.range.text)
      .join("");
    const completeRange = startOffsetMap
      .slice(startRangeIndex, endRangeIndex + 1)
      .map((i) => i.range)
      .reduce((a, b) => a.expandTo(b));
    const [, matchText] = splitTextMatch(affectedRangesPlaintext, startOffsetInStartRange, ruleMatch.length);
    const matchRangeCollection = completeRange.search(matchText, { matchCase: true }).track().load();
    await matchRangeCollection.context.sync();
    // TODO: should also handle 0 and more than 1 results?
    return matchRangeCollection.items[0];
  };

  const newApplier: ApplyReplacementFunction = async (ruleMatch, replacementText) => {
    const matchRange = await getRangeForMatch(ruleMatch);
    if (!matchRange) {
      console.warn("getRangeForMatch returned null or undefined");
      return;
    }
    matchRange.insertText(replacementText, Word.InsertLocation.replace);
    matchRange.select();
    await matchRange.context.sync();
  };

  const newMatchSelector: (ruleMatch: RuleMatch) => void = async (ruleMatch) => {
    const matchRange = await getRangeForMatch(ruleMatch);
    if (!matchRange) {
      console.warn("getRangeForMatch returned null or undefined");
      return;
    }
    matchRange.select("Select");
    matchRange.context.sync();
  };

  setApplier(() => newApplier);
  setMatchSelector(() => newMatchSelector);
}

async function outlookClickHandler(
  setRuleMatches: SetState<RuleMatch[] | null>,
  setApplier: SetState<ApplyReplacementFunction | undefined>
) {
  const currentItem = Office.context.mailbox.item;
  if (!currentItem) throw new Error("No item selected");
  const { value: messageCoercionType } = await invokeAsPromise0(currentItem.body.getTypeAsync);
  if (messageCoercionType === Office.CoercionType.Html) {
    const { value: currentHtml } = await invokeAsPromise1(currentItem.body.getAsync, Office.CoercionType.Html);
    // console.log("currentHtml", currentHtml);
    const doc = new DOMParser().parseFromString(currentHtml, "text/html");
    console.log("doc", doc);
    const newHtml = new XMLSerializer().serializeToString(doc);
    await invokeAsPromise2<string, Office.AsyncContextOptions & Office.CoercionTypeOptions, void>(
      currentItem.body.setAsync,
      newHtml,
      { coercionType: Office.CoercionType.Html }
    );
  } else {
    throw new Error("Unhandled message coercion type " + messageCoercionType);
  }
}

function invokeAsPromise0<R>(
  cbBaseFunc: (callback?: (asyncResult: Office.AsyncResult<R>) => void) => void
): Promise<Office.AsyncResult<R>> {
  return new Promise((resolve, reject) => {
    cbBaseFunc((asyncResult) => {
      switch (asyncResult.status) {
        case Office.AsyncResultStatus.Succeeded: {
          resolve(asyncResult);
          break;
        }
        case Office.AsyncResultStatus.Failed: {
          reject(asyncResult);
          break;
        }
        default:
          reject(new Error("Unknown AsyncResultStatus value " + asyncResult.status));
      }
    });
  });
}

function invokeAsPromise1<T1, R>(
  cbBaseFunc: (arg1: T1, callback?: (asyncResult: Office.AsyncResult<R>) => void) => void,
  arg1: T1
): Promise<Office.AsyncResult<R>> {
  return invokeAsPromise0((cb) => cbBaseFunc(arg1, cb));
}

function invokeAsPromise2<T1, T2, R>(
  cbBaseFunc: (arg1: T1, arg2: T2, callback?: (asyncResult: Office.AsyncResult<R>) => void) => void,
  arg1: T1,
  arg2: T2
): Promise<Office.AsyncResult<R>> {
  return invokeAsPromise0((cb) => cbBaseFunc(arg1, arg2, cb));
}

function findItemContainingOffset(
  startIndexMap: StartOffsetMapItem[],
  offset: number
): { item: StartOffsetMapItem; index: number } {
  const index = startIndexMap.findIndex((i) => i.startOffset <= offset && i.startOffset + i.range.text.length > offset);
  const item = startIndexMap[index];
  return { item: item, index };
}

function extractPlaintextAndIndexMap(paragraphsWithRanges: ParagraphWithRanges[]): {
  plaintext: string;
  startOffsetMap: StartOffsetMapItem[];
} {
  let nextStartIndex = 0;
  let plaintext = "";
  const startOffsetMap: StartOffsetMapItem[] = [];
  const paragraphSeparator = "\n\n";
  for (const { paragraph, ranges } of paragraphsWithRanges) {
    for (const range of ranges) {
      const startIndex = nextStartIndex;
      startOffsetMap.push({ startOffset: startIndex, paragraph, range });
      const rangeText = range.text;
      plaintext += rangeText;
      nextStartIndex += rangeText.length;
    }
    plaintext += paragraphSeparator;
    nextStartIndex += paragraphSeparator.length;
  }

  return { plaintext, startOffsetMap };
}
