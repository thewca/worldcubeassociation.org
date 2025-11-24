import { Badge, Table } from "@chakra-ui/react";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";

export const recordTagBadge = (tag?: string | null) => {
  switch (tag) {
    case "WR": {
      return (
        <Badge variant="solid" colorPalette="red">
          WR
        </Badge>
      );
    }
    case "CR": {
      return (
        <Badge variant="solid" colorPalette="yellow">
          CR
        </Badge>
      );
    }
    case "NR": {
      return (
        <Badge variant="solid" colorPalette="green">
          NR
        </Badge>
      );
    }
    case "PR": {
      return (
        <Badge variant="solid" colorPalette="blue">
          PR
        </Badge>
      );
    }
    default: {
      return null;
    }
  }
};

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
  return attempts.map((a, i) => (
    // One Cell per Solve of an Average. The exact same result may occur multiple times
    //   in the same average (think FMC), so we use the iteration index as key.

    <Table.Cell key={`attempt-${a}-${i}`}>
      {attempts.filter(Boolean).length === 5 &&
      (i === bestResultIndex || i === worstResultIndex)
        ? `(${formatAttemptResult(a, eventId)})`
        : formatAttemptResult(a, eventId)}{" "}
      {recordTag && bestResultIndex === i && recordTagBadge(recordTag)}
    </Table.Cell>
  ));
}
