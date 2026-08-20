import { ComponentPropsWithoutRef } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import type { ReactNode } from "react";
import type { Optional } from "@/lib/types/objects";

type TooltipProps = ComponentPropsWithoutRef<typeof Tooltip>;
type DisabledTooltipProps = Optional<TooltipProps, "content"> & {
  children: ReactNode;
};

export default function BetaDisabledTooltip(props: DisabledTooltipProps) {
  return (
    <Tooltip
      content="Not in the beta, sorry!"
      showArrow
      openDelay={200}
      {...props}
    >
      {props.children}
    </Tooltip>
  );
}
