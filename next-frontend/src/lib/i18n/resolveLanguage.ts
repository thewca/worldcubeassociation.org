import parser from "accept-language-parser";
import { coerceLanguageCode, fallbackLng, languages } from "./settings";

export function resolveLanguage(
  cookie: string | undefined,
  header: string | null,
) {
  if (cookie) return coerceLanguageCode(cookie);

  // Prefer an exact match before allowing a regional variant to fall back.
  const acceptLanguage = parser
    .parse(header ?? undefined)
    .map(
      (accepted) =>
        parser.pick(languages, [accepted]) ??
        parser.pick(languages, [accepted], { loose: true }),
    )
    .find((picked) => picked !== null);

  return coerceLanguageCode(acceptLanguage ?? fallbackLng);
}
