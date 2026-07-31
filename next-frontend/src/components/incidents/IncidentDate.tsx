"use client";

import { Text } from "@chakra-ui/react";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";

// e.g. "Wednesday, June 18 2025 at 5:50 PM GMT+2"
const LOCAL_FORMAT = "cccc, LLLL d yyyy 'at' h:mm a ZZZZ";

export default function IncidentDate({ isoDate }: { isoDate: string }) {
  // The timestamp is rendered in the viewer's timezone, which is only known on
  // the client, so hold it back until after hydration.
  const [localDate, setLocalDate] = useState<string | null>(null);

  useEffect(() => {
    setLocalDate(DateTime.fromISO(isoDate).toLocal().toFormat(LOCAL_FORMAT));
  }, [isoDate]);

  return <Text as="span">{localDate}</Text>;
}
