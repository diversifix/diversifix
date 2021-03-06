import { FC } from "react";
import styled from "styled-components";
import { DoubleCheckMarkIcon } from "../icons";
import { Colors } from "../styles/Colors";
import { Fonts } from "../styles/Fonts";

export const CompletionMessage: FC = () => (
  <CompletionMessageContainer>
    <DoubleCheckMarkIcon fill={Colors.limeGreen} width={90} height={47} />
    <CompletionLabelRow>
      <CompletionLabelLarge>Dein Text ist diversit√§tssensibel!</CompletionLabelLarge>
    </CompletionLabelRow>
  </CompletionMessageContainer>
);

const CompletionMessageContainer = styled.div`
  background: ${Colors.backgroundGray};
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
  color: ${Colors.limeGreen};
  text-align: left;
`;
