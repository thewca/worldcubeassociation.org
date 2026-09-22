"use client";

import ClosableAlert from "@/components/ui/ClosableAlert";
import { useRoundInfo } from "@/providers/RoundInfoProvider";
import { useT } from "@/lib/i18n/useI18n";

export default function RoundLockedAlert() {
  const { state } = useRoundInfo();
  const { t } = useT();

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
