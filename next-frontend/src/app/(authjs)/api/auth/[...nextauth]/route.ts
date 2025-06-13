import { handlers } from "@/auth";
import { handlers as payloadHandlers } from "@/payload.auth";
import { NextRequest } from "next/server";
import { WCA_CMS_PROVIDER_ID } from "@/auth.config";

type HttpVerb = "GET" | "POST";

const wrapRouteHandler =
  (verb: HttpVerb) =>
  async (
    req: NextRequest,
    { params }: { params: Promise<{ nextauth: string[] }> },
  ) => {
    const nextauthParams = await params;
    const providerId = nextauthParams.nextauth[1];

    if (providerId === WCA_CMS_PROVIDER_ID) {
      return payloadHandlers[verb](req);
    }

    return handlers[verb](req);
  };

export const GET = wrapRouteHandler("GET");
export const POST = wrapRouteHandler("POST");
