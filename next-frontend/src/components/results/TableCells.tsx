import { Badge, Box, Float, Table } from "@chakra-ui/react";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import events from "@/lib/wca/data/events";
import _ from "lodash";
import type { ReactNode } from "react";

export const recordTagBadge = (tag?: string | null) => {
  switch (tag) {
    case "WR": {
      return (
        <Badge size="xs" variant="solid" colorPalette="red">
          WR
        </Badge>
      );
    }
    case "ER":
    case "NAR":
    case "SAR":
    case "ASR":
    case "OCR": {
      return (
        <Badge size="xs" variant="solid" colorPalette="yellow">
          CR
        </Badge>
      );
    }
    case "NR": {
      return (
        <Badge size="xs" variant="solid" colorPalette="green">
          NR
        </Badge>
      );
    }
    case "PR": {
      return (
        <Badge size="xs" variant="solid" colorPalette="blue">
          PR
        </Badge>
      );
    }
    default: {
      return null;
    }
  }
};

// Renders the record badge as a superscript floating off the top-right corner
// of its content, without overflowing the surrounding text's line box.
export function WithRecordTag({
  recordTag,
  children,
}: {
  recordTag?: string | null;
  children: ReactNode;
}) {
  const badge = recordTagBadge(recordTag);

  if (!badge) return children;

  return (
    <Box as="span" position="relative" display="inline-block">
      {children}
      <Float placement="top-end" offsetX="-1.5">
        {badge}
      </Float>
    </Box>
  );
}

interface AttemptsCellProps {
  attempts: number[];
  bestResultIndex: number;
  worstResultIndex: number;
  eventId: string;
  recordTag?: string | null;
}

export function AttemptsCells({
  attempts,
  bestResultIndex,
  worstResultIndex,
  eventId,
  recordTag,
}: AttemptsCellProps) {
  const attemptCount =
    events.byId[eventId].recommendedFormat.expected_solve_count;

  return _.times(attemptCount).map((a) => {
    const attempt = attempts[a];
    const key = `attempt-${attempt}-${a}`;

    if (!attempt) return <Table.Cell key={key} />;

    return (
      // One Cell per Solve of an Average. The exact same result may occur multiple times
      //   in the same average (think FMC), so we use the iteration index as key.
      <Table.Cell key={key}>
        <WithRecordTag recordTag={bestResultIndex === a ? recordTag : null}>
          {attempts.filter(Boolean).length === 5 &&
          (a === bestResultIndex || a === worstResultIndex)
            ? `(${formatAttemptResult(attempt, eventId)})`
            : formatAttemptResult(attempt, eventId)}
        </WithRecordTag>
      </Table.Cell>
    );
  });
}
