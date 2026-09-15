import _TwFlag from "@/components/icons/flags/_TwFlag";

import type { ComponentPropsWithoutRef } from "react";
import { Icon } from "@chakra-ui/react";
import Flag from "react-world-flags";

type FlagProps = ComponentPropsWithoutRef<typeof Flag>;
type IconProps = ComponentPropsWithoutRef<typeof Icon>;

type WcaFlagProps = IconProps & Pick<FlagProps, "code">;

const WcaFlag = ({ code, ...restProps }: WcaFlagProps) => {
  if (code?.toUpperCase() === "TW") {
    return <_TwFlag {...restProps} />;
  }

  return (
    <Icon asChild {...restProps}>
      <Flag code={code} fallback={code} />
    </Icon>
  );
};

export default WcaFlag;
