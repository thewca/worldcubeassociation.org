"use client";

import ClosedRoundError from "@/components/live/ClosedRoundError";
import { useRoundInfo } from "@/providers/RoundInfoProvider";
import { useT } from "@/lib/i18n/useI18n";

export default function RoundOpenCheck({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state } = useRoundInfo();
  const { t } = useT();

  const roundClosed = ["pending", "ready"].includes(state);

  if (roundClosed) {
    return <ClosedRoundError t={t} />;
  }

  return children;
}
