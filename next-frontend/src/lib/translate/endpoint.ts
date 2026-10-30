import { addDataAndFileToRequest, type Endpoint } from "payload";
import { isAdmin } from "@/payload.access";
import { syncSoon } from "./hooks";
import { weblateConfigured } from "./weblate";

/**
 * Lets an admin start a sync from the Payload dashboard. The standalone build
 * ships no `payload` CLI, so this is the only way to run `seed` in production
 * and to pull in translations finished in Weblate while nobody edits Payload.
 *
 * The sync runs in the background: a full run over every locale can outlast
 * the load balancer's request timeout.
 */
export const weblateSyncEndpoint: Endpoint = {
  path: "/weblate-sync",
  method: "post",
  handler: async (req) => {
    if (!isAdmin(req.user)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!weblateConfigured) {
      return Response.json(
        { error: "WEBLATE_TOKEN is not set" },
        { status: 503 },
      );
    }
    await addDataAndFileToRequest(req);
    const shouldSeed = req.data?.shouldSeed === true;
    return Response.json({ started: syncSoon(req.payload, { shouldSeed }) });
  },
};
