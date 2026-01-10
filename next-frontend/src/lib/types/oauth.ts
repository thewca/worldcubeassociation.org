import type { PayloadAuthjsUser } from "payload-authjs";
import type { User as PayloadUser } from "@/types/payload";
import type { DefaultSession } from "next-auth";
// This import is necessary to correctly trigger module augmentation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { JWT } from "next-auth/jwt";

declare module "@auth/core/types" {
  interface User extends PayloadAuthjsUser<PayloadUser> {
    wcaId?: string;
  }
}

declare module "next-auth" {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    accessToken: string;
    user: {} & DefaultSession["user"];
    error?: "RefreshTokenError";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    wcaId?: string;
    access_token: string;
    expires_at: number;
    refresh_token?: string;
    error?: "RefreshTokenError";
  }
}
