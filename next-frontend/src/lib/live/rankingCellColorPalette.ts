import { LiveResult } from "@/types/live";

export function rankingCellColorPalette({
  advancing,
  advancing_questionable,
}: Pick<LiveResult, "advancing_questionable" | "advancing">) {
  if (advancing) {
    return "green";
  }

  if (advancing_questionable) {
    return "yellow";
  }

  return "";
}
