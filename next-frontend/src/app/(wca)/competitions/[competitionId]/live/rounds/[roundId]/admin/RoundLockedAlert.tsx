"use client";

import ClosableAlert from "@/components/ui/ClosableAlert";
import { useRoundInfo } from "@/providers/RoundInfoProvider";
import { TFunction } from "i18next";

export default function RoundLockedAlert({ t }: { t: TFunction }) {
  const { state } = useRoundInfo();

  const isLocked = state === "locked";

  if (isLocked) {
    return (
      <ClosableAlert
        status="warning"
        title={t("competitions.live.admin.warnings.round_locked")}
      />
    );
  }
}
