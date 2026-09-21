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
        // `react-country-flag` hardcodes a 1em square as an inline style, which would beat the
        //   class `Icon` sizes the flag with. Undefined values are dropped from the style
        //   attribute, so this hands the box back to `Icon` and letterboxes the 4:3 flag in it.
        style={{ width: undefined, height: undefined, objectFit: "contain" }}
      />
    </Icon>
  );
};

export default WcaFlag;
