import _TwFlag from "@/components/icons/flags/_TwFlag";

import type { ComponentPropsWithoutRef } from "react";
import Flag from "react-world-flags";

type FlagProps = ComponentPropsWithoutRef<typeof Flag>;

const WcaFlag = ({ code, ...restProps }: FlagProps) => {
  if (code?.toUpperCase() === "TW") {
    return <_TwFlag />;
  }

  return <Flag code={code} {...restProps} />;
};

export default WcaFlag;
