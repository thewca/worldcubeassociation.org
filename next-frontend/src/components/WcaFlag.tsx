import _TwFlag from "@/components/icons/flags/_TwFlag";

import type { ComponentPropsWithoutRef } from "react";
import { Icon } from "@chakra-ui/react";
import Flag from "react-world-flags";

type FlagProps = ComponentPropsWithoutRef<typeof Flag> &
  ComponentPropsWithoutRef<typeof Icon>;

const WcaFlag = ({ code, ...restProps }: FlagProps) => {
  if (code?.toUpperCase() === "TW") {
    return <_TwFlag {...restProps} />;
  }

  return <Flag code={code} {...restProps} />;
};

export default WcaFlag;
