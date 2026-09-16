import _TwFlag from "@/components/icons/flags/_TwFlag";

import type { ComponentPropsWithoutRef } from "react";
import { Icon } from "@chakra-ui/react";

type IconProps = ComponentPropsWithoutRef<typeof Icon>;

type WcaFlagProps = IconProps & { code?: string };

const WcaFlag = ({ code, ...restProps }: WcaFlagProps) => {
  if (code?.toUpperCase() === "TW") {
    return <_TwFlag {...restProps} />;
  }

  // `flag-icons` puts the flag in a background image addressed by class name, so a table full of
  //   flags costs one class per cell.
  return (
    <Icon asChild {...restProps}>
      <span className={`fi fi-${code?.toLowerCase()}`} />
    </Icon>
  );
};

export default WcaFlag;
