export function rankingCellColorPalette<
  T extends { advancing: boolean; advancing_questionable: boolean },
>(result: T) {
  if (result.advancing) {
    return "green";
  }

  if (result.advancing_questionable) {
    return "yellow";
  }

  return "";
}
