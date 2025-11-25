import {
  CONNECTION_COLORS,
  CONNECTION_STATE_CONNECTED,
  ConnectionState,
} from "@/lib/hooks/useResultsSubscription";
import usePerpetualState from "@/lib/hooks/usePerpetualState";
import { Box } from "@chakra-ui/react";
const PULSE_DURATION = 2000;

export default function ConnectionPulse({
  connectionState,
  animationDuration = PULSE_DURATION,
}: {
  connectionState: ConnectionState;
  animationDuration?: number;
}) {
  const animationPulse = usePerpetualState(
    (prev) => !prev,
    animationDuration * 1.5,
  );

  const connectionColor = CONNECTION_COLORS[connectionState];

  const isConnected = connectionState === CONNECTION_STATE_CONNECTED;

  const shouldShow = !isConnected || animationPulse;

  return (
    <Box
      w="10px"
      h="10px"
      borderRadius="full"
      bg={connectionColor}
      opacity={shouldShow ? 1 : 0}
      transitionDuration={`${animationDuration}ms`}
      transition="opacity"
    />
  );
}
