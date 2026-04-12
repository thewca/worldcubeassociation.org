import { LiveRoundState } from "@/types/live";
import { TFunction } from "i18next";
import ClosedRoundError from "@/components/live/ClosedRoundError";

export default function RoundOpenCheck({
  state,
  t,
  children,
}: {
  state: LiveRoundState;
  t: TFunction;
  children: React.ReactNode;
}) {
  const roundClosed = ["pending", "ready"].includes(state);

  if (roundClosed) {
    return <ClosedRoundError t={t} />;
  }

  return children;
}
