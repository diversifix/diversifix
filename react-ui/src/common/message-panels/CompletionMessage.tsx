import { FC } from "react";
import styled from "styled-components";
import { DoubleCheckMarkIcon } from "../icons";
import { Colors } from "../styles/Colors";
import { Fonts } from "../styles/Fonts";

export const CompletionMessage: FC = () => (
  <CompletionMessageContainer>
    <DoubleCheckMarkIcon fill={"white"} width={90} height={47} />
    <CompletionLabelRow>
      <CompletionLabelLarge>Dein Text ist nun diversitätssensibel!</CompletionLabelLarge>
      <CompletionLabelSmall>…oder Du hast einfach alle Vorschläge ignoriert :)</CompletionLabelSmall>
    </CompletionLabelRow>
  </CompletionMessageContainer>
);

const CompletionMessageContainer = styled.div`
  background: transparent linear-gradient(180deg, #89b310 0%, #5f912e 100%) 0% 0% no-repeat padding-box;
  box-shadow: 0px 6px 12px ${Colors.dropShadow};
  border-radius: 10px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 24px;
  box-sizing: border-box;
  max-width: 330px;
  padding: 42px 27px;
`;

const CompletionLabelRow = styled.div`
  max-width: 163px;
`;
const CompletionLabelLarge = styled.div`
  font-family: ${Fonts.bam.family};
  font-weight: ${Fonts.bam.weights.bold};
  font-size: 19px;
  line-height: 25px;
  letter-spacing: 0.19px;
  color: white;
  text-align: left;
`;

const CompletionLabelSmall = styled.div`
  font-family: ${Fonts.bam.family};
  font-weight: ${Fonts.bam.weights.normal};
  font-size: 12px;
  line-height: 15px;
  letter-spacing: 0.12px;
  color: white;
  text-align: left;
`;