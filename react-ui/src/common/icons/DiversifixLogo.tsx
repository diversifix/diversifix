import diversifixLogoSrc from "./diversifix-logo.png";
import { FC } from "react";

export const DiversifixLogo: FC<{ width?: number | string }> = ({ width = 350 }) => (
  <img src={diversifixLogoSrc} alt="Diversifix logo" width={width} height="" />
);
