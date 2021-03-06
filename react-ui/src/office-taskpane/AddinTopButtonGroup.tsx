import { FC } from "react";
import styled from "styled-components";
import { DiversifixLogo } from "../common/icons";
import { Colors } from "../common/styles/Colors";
import { Fonts } from "../common/styles/Fonts";
import { UseState } from "../common/UseState";
import { AddinCheckTextButton } from "./AddinCheckTextButton";
import { AddinUserSettingsButton } from "./AddinUserSettingsButton";
import navLinksJson from "../navigation-links.json";
import { isValidUrl } from "../common/isValidUrl";
import { leftMargin, rightMargin } from "./taskpane-style-constants";

const logoLinkUrl = extractLogoLink();

interface AddinButtonGroupProps {
  onCheckClicked: () => void;
  settingsOpenState: UseState<boolean>;
}
export const AddinTopButtonGroup: FC<AddinButtonGroupProps> = ({ onCheckClicked, settingsOpenState }) => (
  <AddinButtonGroupContainer>
    <DiversifixLogoLinkTile />
    <AddinUserSettingsButton pressedState={settingsOpenState} />
    <AddinCheckTextButton onClick={onCheckClicked} />
  </AddinButtonGroupContainer>
);
const AddinButtonGroupContainer = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin: 5px ${rightMargin} 0 ${leftMargin};
`;

const DiversifixLogoLinkTile = () => (
  <DiversifixLogoLinkTileContainer href={logoLinkUrl} target={"_blank"}>
    <DiversifixLogoContainer>
      <DiversifixLogo width="100%" />
    </DiversifixLogoContainer>
    <DiversifixLogoLinkText>EINFACH DIVERSIT√ĄTSSENSIBEL</DiversifixLogoLinkText>
  </DiversifixLogoLinkTileContainer>
);

const DiversifixLogoLinkTileContainer = styled.a`
  background: #ffffff 0% 0% no-repeat padding-box;
  box-shadow: 0px 3px 6px #00000029;
  border-radius: 8px;
  min-width: 145px;
  min-height: 95px;
  display: flex;
  flex-direction: column;
  gap: 13px;
  padding: 15px 12px 10px;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  text-decoration: none;
  color: ${Colors.darkBlueText};
  user-select: none;

  &[href]:hover {
    background: #f3f3f3;
  }
`;
const DiversifixLogoContainer = styled.div`
  width: 100%;
  display: flex;
  max-height: 30px;
  align-items: center;
`;
const DiversifixLogoLinkText = styled.div`
  font-family: ${Fonts.bam.family};
  font-size: 9px;
  line-height: 10.5px;
  font-style: italic;
  font-weight: ${Fonts.bam.weights.bold};
  max-width: 120px;
  text-align: center;
`;

function extractLogoLink() {
  const urlValue = (navLinksJson as any)?.addinLogoLinkUrl;
  if (typeof urlValue !== "string") {
    console.error("Addin logo link URL not found");
    return undefined;
  }
  if (!isValidUrl(urlValue)) {
    console.error("Addin logo link URL is not a valid URL");
    return undefined;
  }
  return urlValue;
}
