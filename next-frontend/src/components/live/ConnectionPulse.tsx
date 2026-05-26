"use client";

import {
  CONNECTION_COLORS,
  CONNECTION_STATE_CONNECTED,
  CONNECTION_TRANSLATION_KEYS,
  ConnectionState,
} from "@/lib/hooks/useResultsSubscription";
import { Tooltip } from "@/components/ui/tooltip";
import { Badge, Status, Text } from "@chakra-ui/react";
import { useT } from "@/lib/i18n/useI18n";

export default function ConnectionPulse({
  connectionState,
}: {
  connectionState: ConnectionState;
}) {
  const { t } = useT();

  const translationKey = CONNECTION_TRANSLATION_KEYS[connectionState];
  const isConnected = connectionState === CONNECTION_STATE_CONNECTED;

  return (
    <Status.Root
      colorPalette={CONNECTION_COLORS[connectionState]}
      display="inline-flex"
    >
      <Tooltip
        content={t(`competitions.live.connection.${translationKey}`)}
        showArrow
        openDelay={200}
      >
        <Badge variant="solid" display="inline-flex" gap={2} size="sm">
          <Status.Indicator animation={isConnected ? "pulse" : undefined} />
          <Text>
            {t(`competitions.live.connection.status.${translationKey}`)}
          </Text>
        </Badge>
      </Tooltip>
    </Status.Root>
  );
}
