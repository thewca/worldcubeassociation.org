"use client";

import {
  CONNECTION_COLORS,
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
        animation={
          connectionState === "connected"
            ? "pulse 2s ease-in-out infinite alternate"
            : ""
        }
      />
      {t(`competitions.live.connection.${connectionState}`)}
    </Status.Root>
  );
}
