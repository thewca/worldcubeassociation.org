import { Badge, BadgeProps, Box, Float, Table } from "@chakra-ui/react";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import _ from "lodash";
import type { ReactNode } from "react";

const recordTagBadge = (tag?: string | null) => {
  switch (tag) {
    case "WR": {
      return { color: "red", label: "WR" };
    }
    case "AfR":
    case "AsR":
    case "ER":
    case "NAR":
    case "OcR":
    case "SAR": {
      return { color: "yellow", label: "CR" };
    }
    case "NR": {
      return { color: "green", label: "NR" };
    }
    case "PR": {
      return { color: "blue", label: "PR" };
    }
    default: {
      return null;
    }
  }
};

// Width reserved at the end of the value for the floating badge: `Float` is
// absolutely positioned and contributes no width of its own, so without it the
// badge overlaps whatever sits in the next column.
const RECORD_TAG_SLOT = "7";

type RecordTagBadge = NonNullable<ReturnType<typeof recordTagBadge>>;

function RecordBadge({
  badge,
  ...props
}: { badge: RecordTagBadge } & BadgeProps) {
  return (
    <Badge
      size="xs"
      variant="solid"
      colorPalette={badge.color}
      minHeight="3.5"
      {...props}
    >
      {badge.label}
    </Badge>
  );
}

// Renders the record badge as a superscript floating off the top-right corner
// of its content, without overflowing the surrounding text's line box.
export function WithRecordTag({
  recordTag,
  hanging = false,
  children,
}: {
  recordTag?: string | null;
  // Hang the badge past the end of the value instead of reserving space for
  //   it, so tagged and untagged values stay aligned. The badge then sits in
  //   the cell padding, which must be wide enough for it.
  hanging?: boolean;
  children: ReactNode;
}) {
  const badge = recordTagBadge(recordTag);

  if (!badge) return children;

  const positionedBadge = hanging ? (
    <RecordBadge
      badge={badge}
      position="absolute"
      insetInlineStart="full"
      top="-1.5"
      marginStart="0.5"
      paddingInline="0.5"
    />
  ) : (
    <Float placement="top-end" offsetX="3.5" offsetY="1">
      <RecordBadge badge={badge} />
    </Float>
  );

  return (
    <Box
      as="span"
      position="relative"
      display={hanging ? undefined : "inline-block"}
      paddingEnd={hanging ? undefined : RECORD_TAG_SLOT}
    >
      {children}
      {positionedBadge}
    </Box>
  );
}

interface AttemptsCellProps {
  attempts: number[];
  bestResultIndex: number;
  worstResultIndex: number;
  eventId: string;
  recordTag?: string | null;
  attemptCount: number;
}

export function AttemptsCells({
  attempts,
  bestResultIndex,
  worstResultIndex,
  eventId,
  recordTag,
  attemptCount,
}: AttemptsCellProps) {
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

// Mirrors the old Rails `pb_type_class_for_result`: a result that was a personal
// best at the time it was achieved is coloured, upgraded to the record's own
// colour when it was also a regional record.
export function personalBestColor(regionalRecord?: string | null) {
  switch (regionalRecord) {
    case "WR":
      return "recordMarkers.world";
    case "NR":
      return "recordMarkers.national";
    case "":
    case null:
    case undefined:
      return "recordMarkers.personal";
    default:
      return "recordMarkers.continental";
  }
}
