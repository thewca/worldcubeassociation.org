import NextAuth from "next-auth";
import { withPayloadAuthjs } from "payload-authjs";
import { getPayload } from "payload";
import payloadConfig from "@payload-config";
import { payloadAuthConfig } from "@/auth.config";

export const { handlers } = NextAuth(async () =>
  withPayloadAuthjs({
    payload: await getPayload({ config: payloadConfig }),
    config: payloadAuthConfig,
    collectionSlug: "users",
  }),
);
