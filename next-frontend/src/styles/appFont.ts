import { Rubik } from "next/font/google";

const devFont = Rubik({ subsets: ["latin"] });

const shouldUseProprietaryFont = () =>
  process.env.NODE_ENV !== "development" &&
  process.env.PROPRIETARY_FONT === "TTNormsPro";

const computeAppFont = async () => {
  if (shouldUseProprietaryFont()) {
    const { ttNormsPro } = await import("@/styles/fonts");

    return ttNormsPro;
  }

  return devFont;
};

export { computeAppFont };
