import _TwFlag from "@/components/icons/flags/_TwFlag";

import type { ComponentPropsWithoutRef } from "react";
import Flag from "react-world-flags";

type FlagProps = ComponentPropsWithoutRef<typeof Flag>;

const WcaFlag = ({ code, fallback, ...restProps }: FlagProps) => {
  if (code?.toUpperCase() === "TW") {
    return (
      <_TwFlag
        {...(restProps as unknown as ComponentPropsWithoutRef<typeof _TwFlag>)}
      />
    );
  }

  return <Flag code={code} fallback={fallback} {...restProps} />;
};

export default WcaFlag;
