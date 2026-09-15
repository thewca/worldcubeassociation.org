import { NextRequest } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { fallbackLng } from "@/lib/i18n/settings";
import { runSync } from "@/lib/translate/sync";
import { listLanguages, weblateConfigured } from "@/lib/translate/weblate";

/**
 * Syncs Payload CMS content with Weblate.
 *
 * Translators work entirely in Weblate — there is no translation UI in this
 * app. This route is the bridge:
 *
 *   GET   progress per language, straight from Weblate
 *   POST  push source strings up, pull finished translations back down
 *
 * `?seed=1` additionally uploads translations that already exist in Payload
 * before pulling. That is a one-time migration step: routine syncs deliberately
 * never push translations upward, because doing so would overwrite newer work
 * by translators with whatever Payload happens to hold.
 */

// Sync is an operator action, not a per-translator one — Weblate owns
// per-language permissions now, via its own teams.
async function authorize(
  req: NextRequest,
): Promise<{ payload: Awaited<ReturnType<typeof getPayload>> } | Response> {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const roles = user.roles as string[] | undefined;
  if (!roles?.includes("wst_admin")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!weblateConfigured) {
    return Response.json(
      { error: "WEBLATE_TOKEN is not configured" },
      { status: 503 },
    );
  }
  return { payload };
}

export async function GET(req: NextRequest): Promise<Response> {
  const auth = await authorize(req);
  if (auth instanceof Response) return auth;

  try {
    return Response.json({
      sourceLocale: fallbackLng,
      languages: await listLanguages(),
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 502 });
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  const auth = await authorize(req);
  if (auth instanceof Response) return auth;

  const seed = new URL(req.url).searchParams.get("seed") === "1";
  try {
    const report = await runSync(auth.payload, { seed });
    return Response.json({
      ...report,
      seeded: seed ? report.seeded : undefined,
      applied: report.applied.filter((r) => r.stringsWritten > 0),
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 502 });
  }
}
