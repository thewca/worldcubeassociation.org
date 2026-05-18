"use client";

import {
  CONNECTION_COLORS,
  CONNECTION_STATE_CONNECTED,
  CONNECTION_TRANSLATION_KEYS,
  ConnectionState,
} from "@/lib/hooks/useResultsSubscription";
import { Tooltip } from "@/components/ui/tooltip";
import { Badge, Box, Status, Text } from "@chakra-ui/react";
import { useT } from "@/lib/i18n/useI18n";

export default function ConnectionPulse({
  connectionState,
}: {
  connectionState: ConnectionState;
  animationDuration?: number;
}) {
  const { t } = useT();

  const connectionColor = CONNECTION_COLORS[connectionState];
  const mainLabel = t(
    `competitions.live.connection.status.${CONNECTION_TRANSLATION_KEYS[connectionState]}`,
  );

  return (
    <Status.Root colorPalette={connectionColor} display="inline-flex">
      <Tooltip
        content={t(
          `competitions.live.connection.${CONNECTION_TRANSLATION_KEYS[connectionState]}`,
        )}
        showArrow
        openDelay={200}
      >
        <Badge variant="solid" display="inline-flex" gap={2} size="sm">
          <Box
            boxSize={{ base: "1.5", sm: "2" }}
            borderRadius="full"
            bg="colorPalette.contrast"
            animationName={
              connectionState === CONNECTION_STATE_CONNECTED
                ? "pulse"
                : undefined
            }
            animationDuration="1.5s"
            animationTimingFunction="ease-in-out"
            animationIterationCount="infinite"
            animationDirection="alternate"
          />
          <Text
            as="span"
            fontSize="inherit"
            fontWeight="medium"
            textTransform="uppercase"
            lineHeight="1"
          >
            {mainLabel}
          </Text>
        </Badge>
      </Tooltip>
    </Status.Root>
  );
}
