export type ResultsSearchParams = Record<string, string | string[] | undefined>;

export function toURLSearchParams(searchParams: ResultsSearchParams) {
  const entries = Object.entries(searchParams).flatMap(([key, value]) => {
    const values = typeof value === "string" ? [value] : (value ?? []);
    return values.map((item) => [key, item]);
  });

  return new URLSearchParams(entries);
}
