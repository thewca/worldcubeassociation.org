/**
 * Minimal Weblate REST client for the Payload CMS component.
 *
 * The component is created with `vcs: "local"` / `repo: "local:"`, so Weblate
 * owns a git repo it manages itself and there is no external repository of
 * generated JSON to keep in sync. Files move in and out purely over the API:
 * we upload the source strings, translators work in Weblate, we download the
 * translated files back. See weblate/seed-payload.sh.
 *
 * `file_format: "json"` (flat) is deliberate — our keys are dotted paths like
 * `home:blocks(TextCard)[abc].body#0.1.0`, and `json-nested` would split them
 * on the dots into a tree that no longer round-trips.
 */

const url = process.env.WEBLATE_URL ?? "http://localhost:8080";
const token = process.env.WEBLATE_TOKEN;
const project = process.env.WEBLATE_PROJECT ?? "wca";
const component = process.env.WEBLATE_COMPONENT ?? "payload";

export const weblateConfigured = Boolean(token);

function headers(): HeadersInit {
  if (!token) {
    throw new Error(
      "WEBLATE_TOKEN is not set; cannot talk to Weblate. Get a token from " +
        `${url}/accounts/profile/#api`,
    );
  }
  return { Authorization: `Token ${token}` };
}

async function call(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${url}/api${path}`, {
    ...init,
    headers: { ...headers(), ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(
      `Weblate ${init?.method ?? "GET"} ${path} failed: ${res.status} ${await res.text()}`,
    );
  }
  return res;
}

export interface LanguageStats {
  code: string;
  total: number;
  translated: number;
  percent: number;
}

/** Languages that already exist in the component, with their progress. */
export async function listLanguages(): Promise<LanguageStats[]> {
  const out: LanguageStats[] = [];
  let next: string | null = `/components/${project}/${component}/translations/`;
  while (next) {
    const page: {
      next: string | null;
      results: {
        language_code: string;
        total: number;
        translated: number;
        translated_percent: number;
      }[];
    } = await (await call(next)).json();
    for (const t of page.results) {
      out.push({
        code: t.language_code,
        total: t.total,
        translated: t.translated,
        percent: t.translated_percent,
      });
    }
    // Weblate returns an absolute URL for `next`; strip back to the API path.
    next = page.next ? new URL(page.next).pathname.replace(/^\/api/, "") : null;
  }
  return out;
}

/**
 * Payload locale -> the language code Weblate expects in an API path.
 *
 * Weblate has its own language database and does not know several of WCA's
 * codes: there is no `es-ES` (it is plain `es`), and Chinese is script-based
 * (`zh_Hans`/`zh_Hant`) rather than region-based. Everything not listed here is
 * a plain two-letter code that both sides already agree on.
 *
 * Note this is NOT the same as the `language_code` the component reports:
 * `language_code_style: linux` renders `zh_Hans` as `zh_CN` in listings, but
 * only `zh_Hans` resolves in a URL. Always address Weblate with these codes.
 */
const WEBLATE_LANGUAGE_CODES: Record<string, string> = {
  "es-ES": "es",
  "es-419": "es_419",
  "fr-CA": "fr_CA",
  "pt-BR": "pt_BR",
  "zh-CN": "zh_Hans",
  "zh-TW": "zh_Hant",
};

export function weblateCode(locale: string): string {
  return WEBLATE_LANGUAGE_CODES[locale] ?? locale;
}

async function translationExists(code: string): Promise<boolean> {
  const res = await fetch(
    `${url}/api/translations/${project}/${component}/${code}/`,
    { headers: headers(), cache: "no-store" },
  );
  return res.ok;
}

/**
 * Create the translation for `locale` if the component lacks one, and return
 * the Weblate code to address it by.
 *
 * Existence is checked rather than inferred from the POST, because Weblate
 * answers "this language already exists" and "I have never heard of this
 * language" with the same 400 and the same `Could not add 'x'!` message. An
 * earlier version treated every 400 as benign and silently skipped six locales.
 */
export async function ensureLanguage(locale: string): Promise<string> {
  const code = weblateCode(locale);
  if (await translationExists(code)) return code;

  await fetch(`${url}/api/components/${project}/${component}/translations/`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({ language_code: code }),
    cache: "no-store",
  });

  if (!(await translationExists(code))) {
    throw new Error(
      `Weblate has no language for Payload locale "${locale}" (tried "${code}"). ` +
        "Add a mapping to WEBLATE_LANGUAGE_CODES in weblate.ts.",
    );
  }
  return code;
}

function jsonFile(strings: Record<string, string>, name: string): FormData {
  const form = new FormData();
  form.append("file", new Blob([JSON.stringify(strings, null, 2)]), name);
  return form;
}

/**
 * Replace the source file. `method=replace` is what lets strings that no longer
 * exist in Payload disappear from Weblate — with `translate` they would linger
 * forever as orphaned units.
 */
export async function pushSource(
  strings: Record<string, string>,
): Promise<void> {
  const form = jsonFile(strings, "en.json");
  form.append("method", "replace");
  await call(`/translations/${project}/${component}/en/file/`, {
    method: "POST",
    body: form,
  });
}

/**
 * Seed an existing translation into Weblate. Only used by the one-time
 * `?seed=1` migration — routine syncs must never push translations upward or
 * they would clobber newer work done by translators.
 */
export async function pushTranslations(
  locale: string,
  strings: Record<string, string>,
): Promise<{ accepted: number; total: number }> {
  const code = weblateCode(locale);
  const form = jsonFile(strings, `${code}.json`);
  form.append("method", "translate");
  const res = await call(
    `/translations/${project}/${component}/${code}/file/`,
    {
      method: "POST",
      body: form,
    },
  );
  const body: { accepted: number; total: number } = await res.json();
  return { accepted: body.accepted, total: body.total };
}

/** Download the translated file for `code` as a flat key/value map. */
export async function pullTranslations(
  locale: string,
): Promise<Record<string, string>> {
  const code = weblateCode(locale);
  const res = await call(`/translations/${project}/${component}/${code}/file/`);
  const body = (await res.json()) as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(body)) {
    // Untranslated units come back as empty strings; treat them as absent so a
    // blank never overwrites anything in Payload.
    if (typeof value === "string" && value.trim() !== "") out[key] = value;
  }
  return out;
}
