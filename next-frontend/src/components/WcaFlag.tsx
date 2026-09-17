import _TwFlag from "@/components/icons/flags/_TwFlag";

import type { ComponentPropsWithoutRef } from "react";
import { Icon } from "@chakra-ui/react";
import ReactCountryFlag from "react-country-flag";

type IconProps = ComponentPropsWithoutRef<typeof Icon>;

type WcaFlagProps = IconProps & { code?: string };

// Our own mirror of the `flag-icons` 4x3 SVGs. Fetching them per flag keeps the ~2 MB of flag
//   markup out of every bundle that renders one, and the assets CDN serves them immutably.
const FLAG_CDN_URL = "https://assets.worldcubeassociation.org/flags/4x3/";

const WcaFlag = ({ code, size = "md", ...restProps }: WcaFlagProps) => {
  if (!code) {
    return null;
  }

  if (code.toUpperCase() === "TW") {
    return <_TwFlag size={size} {...restProps} />;
  }

  return (
    <Icon asChild size={size} {...restProps}>
      <ReactCountryFlag
        svg
        countryCode={code}
        cdnUrl={FLAG_CDN_URL}
        // `react-country-flag` hardcodes a 1em square inline, which beats the class that `Icon`
        //   sizes the flag with. Hand the box back to `Icon` and letterbox the 4:3 flag in it.
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </Icon>
  );
};

export default WcaFlag;
