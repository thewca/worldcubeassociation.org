import _TwFlag from "@/components/icons/flags/_TwFlag";

import type { ComponentPropsWithoutRef } from "react";
import Flag from "react-world-flags";

type FlagProps = ComponentPropsWithoutRef<typeof Flag>;
type TwFlagProps = ComponentPropsWithoutRef<typeof _TwFlag>;

type WcaFlagProps = {
  code?: string,
  fallback?: React.ReactNode | null;
} & Pick<
  FlagProps & TwFlagProps,
  Extract<keyof FlagProps, keyof TwFlagProps>
>;

const WcaFlag = (props: WcaFlagProps) => {
  if (props.code?.toUpperCase() === "TW") {
    const { code: _code, fallback: _fallback, ...twProps } = props;
    return <_TwFlag {...twProps} />;
  }

  return <Flag {...props} />;
};

export default WcaFlag;
