import type { PayloadAuthjsUser } from "payload-authjs";
import type { User as PayloadUser } from "@/types/payload";
import type { DefaultSession } from "next-auth";
// This import is necessary to correctly trigger module augmentation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { JWT } from "next-auth/jwt";

declare module "@auth/core/types" {
  interface User extends PayloadAuthjsUser<PayloadUser> {
    wcaId?: string;
    wcaUserId?: number;
  }
}

declare module "next-auth" {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    accessToken: string;
    /**
     * The numeric WCA user id, i.e. `User#id` in the Rails backend.
     * Not to be confused with `user.wcaId`, which is the public WCA ID like "2015ABCD01".
     * Absent on sessions that were issued before this claim was carried through the token.
     */
    wcaUserId?: number;
    user: {} & DefaultSession["user"];
    error?: "RefreshTokenError";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    wcaId?: string;
    wcaUserId?: number;
    access_token: string;
    expires_at: number;
    refresh_token?: string;
    error?: "RefreshTokenError";
  }
}
