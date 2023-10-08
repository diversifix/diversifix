import { WelcomeMessageContainer, WelcomeMessageBody } from "./WelcomeMessage";
import styled from "styled-components";
import msWordIcon from "../icons/ms_word.png";

export const AddInMessage = () => (
  <AddInMessageContainer>
    <WelcomeMessageBody>
      DIVERSIFIX gibt es auch als <br />
      <PanelLink
        href="https://appsource.microsoft.com/en-us/product/office/WA200004537"
        target="_blank"
        rel="noreferrer"
      >
        Add-In für Microsoft Word
      </PanelLink>
      .
    </WelcomeMessageBody>
    <a href="https://appsource.microsoft.com/en-us/product/office/WA200004537" target="_blank" rel="noreferrer">
      <AddInLogo src={msWordIcon} alt="Link zum Diversifix Word Add-In" />
    </a>
  </AddInMessageContainer>
);

const AddInMessageContainer = styled(WelcomeMessageContainer)`
  margin-top: 20px;
  flex-direction: row;
  align-items: center;
`;

const AddInLogo = styled.img`
  max-width: 50px;
  margin: 10px;
`;

const PanelLink = styled.a`
  text-decoration: none;
  color: #1b9cd8;
`;
