"use client";

import { TFunction } from "i18next";
import ClosedRoundError from "@/components/live/ClosedRoundError";
import { useRoundInfo } from "@/providers/RoundInfoProvider";

export default function RoundOpenCheck({
  t,
  children,
}: {
  t: TFunction;
  children: React.ReactNode;
}) {
  const { state } = useRoundInfo();

  const roundClosed = ["pending", "ready"].includes(state);

  if (roundClosed) {
    return <ClosedRoundError t={t} />;
  }

  return children;
}
