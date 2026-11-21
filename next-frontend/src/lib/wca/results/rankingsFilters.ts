export const RANKINGS_SHOW = {
  persons: "100 persons",
  results: "100 results",
  byRegion: "by region",
} as const;

export type RankingsShow = (typeof RANKINGS_SHOW)[keyof typeof RANKINGS_SHOW];

export const DEFAULT_RANKINGS_FILTERS = {
  event: "333",
  region: "world",
  gender: "All",
  rankingType: "single",
  show: RANKINGS_SHOW.persons,
} as const;

export function getRankingsShow(show: string | null | undefined): RankingsShow {
  // Match the API's legacy spelling and normalize older result limits to 100.
  const normalized = show?.replaceAll("+", " ").toLowerCase();
  if (normalized === RANKINGS_SHOW.byRegion) return RANKINGS_SHOW.byRegion;
  if (normalized && /^\s*\d+\s+results\b/.test(normalized))
    return RANKINGS_SHOW.results;
  return RANKINGS_SHOW.persons;
}
