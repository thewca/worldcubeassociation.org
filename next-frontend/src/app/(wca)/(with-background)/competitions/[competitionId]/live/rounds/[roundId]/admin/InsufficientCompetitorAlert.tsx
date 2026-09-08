"use client";

import ClosableAlert from "@/components/ui/ClosableAlert";
import { useAllRoundsInfo, useRoundInfo } from "@/providers/RoundInfoProvider";
import { useT } from "@/lib/i18n/useI18n";

export default function InsufficientCompetitorAlert() {
  const round = useRoundInfo();
  const { rounds } = useAllRoundsInfo();
  const { t } = useT();

  // linkedRounds is ordered, so the round we advanced from is the one before us
  const linkedRoundIds = round.linkedRounds ?? [];
  const previousRoundId = linkedRoundIds[linkedRoundIds.indexOf(round.id) - 1];
  const previousRound = rounds.find((r) => r.id === previousRoundId);

  const competitorCountNeeded = round.min_competitors_to_open;

  const violates9m =
    round.state === "open" &&
    competitorCountNeeded !== undefined &&
    previousRound !== undefined &&
    // Locked or Open
    "total_competitors" in previousRound &&
    previousRound.total_competitors < competitorCountNeeded;

  if (violates9m) {
    return (
      <ClosableAlert
        status="warning"
        title={t("competitions.live.admin.warnings.9m_violated", {
          competitor_count_needed: competitorCountNeeded,
        })}
      />
    );
  }
}
