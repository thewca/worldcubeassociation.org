"use client";

import useLocalDateTime from "@/lib/hooks/useLocalDateTime";

// Lets Server Components render a timestamp in the viewer's time zone.
export default function LocalDateTime({
  isoDateTime,
}: {
  isoDateTime: string;
}) {
  return useLocalDateTime(isoDateTime);
}
