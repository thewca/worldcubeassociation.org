"use client";

import ClosableAlert from "@/components/ui/ClosableAlert";
import { useAllRoundsInfo, useRoundInfo } from "@/providers/RoundInfoProvider";
import { useT } from "@/lib/i18n/useI18n";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";

export default function InsufficientCompetitorAlert() {
  const currentRound = useRoundInfo();
  const allRounds = useAllRoundsInfo();
  const previousRound = allRounds.rounds.find(
    (r) =>
      parseActivityCode(r.id).roundNumber ===
      parseActivityCode(currentRound.id).roundNumber! - 1,
  );
  const { t } = useT();

  const violates9m =
    previousRound &&
    currentRound.state === "open" &&
    // Locked or Open
    "total_competitors" in previousRound &&
    previousRound.total_competitors < 8;

  if (violates9m) {
    return (
      <ClosableAlert
        status="warning"
        title={t("competitions.live.admin.warnings.9m_violated", {
          competitor_count_needed: 8,
        })}
      />
    );
  }
}
