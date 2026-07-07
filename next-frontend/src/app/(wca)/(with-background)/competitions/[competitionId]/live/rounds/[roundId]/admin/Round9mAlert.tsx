"use client";

import ClosableAlert from "@/components/ui/ClosableAlert";
import { useRoundInfo } from "@/providers/RoundInfoProvider";
import { useT } from "@/lib/i18n/useI18n";

export default function Round9mAlert() {
  const round = useRoundInfo();
  const { t } = useT();

  const violates9m = round.state === "open" && round.completed_competitors < 8;

  if (violates9m) {
    return (
      <ClosableAlert
        status="warning"
        title={t("competitions.live.admin.warnings.9m_violated")}
      />
    );
  }
}
