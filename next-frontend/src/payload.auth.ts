import NextAuth from "next-auth";
import { withPayload } from "payload-authjs";
import payloadConfig from "@payload-config";
import { payloadAuthConfig } from "@/auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth(
  withPayload(payloadAuthConfig, { payloadConfig }),
);
