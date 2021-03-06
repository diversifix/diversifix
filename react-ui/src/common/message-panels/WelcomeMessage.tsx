import styled from "styled-components";
import { Colors } from "../styles/Colors";
import { Fonts } from "../styles/Fonts";
import wavingHandEmojiSrc from "../icons/waving-hand-emoji.png";
import { UserSettingsAndFeatureFlagsContext } from "../UserSettingsAndFeatureFlagsContext";

export const WelcomeMessage = () => (
  <WelcomeMessageContainer>
    <WelcomeMessageIntroBox>
      <IntroIconContainer>
        <IntroIcon src={wavingHandEmojiSrc} alt="Waving hand emoji" />
      </IntroIconContainer>
      <IntroTextColumn>
        <WelcomeMessageIntroLarge>Herzlich Willkommen bei DIVERSIFIX.</WelcomeMessageIntroLarge>
      </IntroTextColumn>
    </WelcomeMessageIntroBox>
    <WelcomeMessageBody>
      Prüfe Deine Texte auf Diversitätslücken.
      <UserSettingsAndFeatureFlagsContext.Consumer>
        {({ featureFlags }) =>
          featureFlags.isBamBuild
            ? " DIVERSIFIX ist aktuell basierend auf den Präferenzen des BAM Leitfadens für geschlechtersensible Sprache eingestellt. Wenn Du einen anderen Genderstil bevorzugst, kannst Du das in den Einstellungen anpassen."
            : " Standardmäßig werden dir Alternativen in neutraler Form oder Doppelnennung vorgeschlagen. In den Einstellungen kannst Du auch einen anderen Genderstil auswählen."
        }
      </UserSettingsAndFeatureFlagsContext.Consumer>
    </WelcomeMessageBody>
  </WelcomeMessageContainer>
);

const WelcomeMessageContainer = styled.div`
  font-family: ${Fonts.bam.family};
  font-style: italic;
  background: white;
  box-shadow: 0px 6px 12px ${Colors.dropShadow};
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  max-width: 330px;
`;

const WelcomeMessageIntroBox = styled.div`
  background: ${Colors.darkBlueText};
  border-radius: 10px 10px 0px 0px;
  color: white;
  display: flex;
  gap: 21px;
  align-items: center;
`;
const IntroIconContainer = styled.div`
  margin: 0 0 0 13px;
  flex-shrink: 1;
`;
const IntroIcon = styled.img`
  /* max-width: 84px;
  min-width: 60px; */
  width: 100%;
`;
const IntroTextColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin: 36px 22px 36px 0;
  width: 190px;
  flex-shrink: 0;
`;

const WelcomeMessageIntroLarge = styled.p`
  font-weight: ${Fonts.bam.weights.bold};
  margin: 0;
  font-size: 20px;
  line-height: 24px;
  letter-spacing: 0.2px;
`;

const WelcomeMessageBody = styled.p`
  margin: 15px 13px;
  font-weight: ${Fonts.bam.weights.normal};
  font-size: 16px;
  line-height: 19px;
  letter-spacing: 0.08px;
  color: ${Colors.darkBlueText};
  display: block;
`;
