import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/auth";

// This is just the auth route for next, for payload, it is mounted as part of the payload catch all
// see payload.auth.ts createCmsAuth->basePath
export const { GET, POST } = toNextJsHandler(auth);
