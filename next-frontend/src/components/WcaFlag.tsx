import type { ComponentPropsWithoutRef } from "react";
import Flag from "react-world-flags";

const WcaFlag = ({
  code,
  fallback,
  ...rest
}: ComponentPropsWithoutRef<typeof Flag>) => {
  if (code?.toUpperCase() === "TW") {
    return <img {...rest} src="/flags/tw.svg" />;
  }

  return <Flag code={code} fallback={fallback} {...rest} />;
};

export default WcaFlag;
