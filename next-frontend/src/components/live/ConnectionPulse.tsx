"use client";

import {
  CONNECTION_COLORS,
  CONNECTION_STATE_CONNECTED,
  ConnectionState,
} from "@/lib/hooks/useResultsSubscription";
import { Status } from "@chakra-ui/react";
import { useT } from "@/lib/i18n/useI18n";

export default function ConnectionPulse({
  connectionState,
}: {
  connectionState: ConnectionState;
  animationDuration?: number;
}) {
  const { t } = useT();

  const connectionColor = CONNECTION_COLORS[connectionState];

  return (
    <Status.Root colorPalette={connectionColor}>
      <Status.Indicator
        animationName={
          connectionState === CONNECTION_STATE_CONNECTED ? "pulse" : undefined
        }
        animationDuration="1.5s"
        animationTimingFunction="ease-in-out"
        animationIterationCount="infinite"
        animationDirection="alternate"
      />
      {t(`competitions.live.connection.${connectionState}`)}
    </Status.Root>
  );
}
