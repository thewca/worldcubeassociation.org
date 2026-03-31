import { LiveRoundAdminBase } from "@/types/live";
import { TFunction } from "i18next";
import ClosedRoundError from "@/components/live/ClosedRoundError";

export default function RoundOpenCheck({
  round,
  t,
  children,
}: {
  round: Pick<LiveRoundAdminBase, "state">;
  t: TFunction;
  children: React.ReactNode;
}) {
  const roundClosed = ["pending", "ready"].includes(round.state);

  if (roundClosed) {
    return <ClosedRoundError t={t} />;
  }

  return children;
}
