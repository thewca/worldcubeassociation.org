const TEAM_DISPLAY_ABBREVIATIONS: Record<string, string> = {
  wapc: "WAC",
};

export function teamDisplayAbbreviation(friendlyId: string) {
  return TEAM_DISPLAY_ABBREVIATIONS[friendlyId] ?? friendlyId.toUpperCase();
}
