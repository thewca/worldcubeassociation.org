import _TwFlag from "@/components/icons/flags/_TwFlag";

import type { ComponentPropsWithoutRef } from "react";
import Flag from "react-world-flags";

type FlagProps = ComponentPropsWithoutRef<typeof Flag>;

const WcaFlag = ({
  code,
  width,
  height,
  className,
  style,
  ...restProps
}: FlagProps) => {
  if (code?.toUpperCase() === "TW") {
    return (
      <_TwFlag
        width={width}
        height={height}
        className={className}
        style={style}
      />
    );
  }

  return (
    <Flag
      code={code}
      width={width}
      height={height}
      className={className}
      style={style}
      {...restProps}
    />
  );
};

export default WcaFlag;
