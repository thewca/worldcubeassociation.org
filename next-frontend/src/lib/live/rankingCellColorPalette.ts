export function rankingCellColorPalette({
  advancing,
  advancing_questionable,
}: {
  advancing: boolean;
  advancing_questionable: boolean;
}) {
  if (advancing) {
    return "green";
  }

  if (advancing_questionable) {
    return "yellow";
  }

  return "";
}
