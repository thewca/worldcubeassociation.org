import NextAuth from "next-auth";
import { PayloadAuthjsUser, withPayload } from "payload-authjs";
import payloadConfig from "@payload-config";
import { payloadAuthConfig } from "@/auth.config";

import type { User as PayloadUser } from "@/types/payload";

declare module "@auth/core/types" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface User extends PayloadAuthjsUser<PayloadUser> {}
}

export const { handlers, signIn, signOut, auth } = NextAuth(
  withPayload(payloadAuthConfig, {
    payloadConfig,
    events: {
      signIn: async ({ user, payload }) => {
        if (!user.id || !payload) {
          return;
        }

        await payload.update({
          collection: "users",
          id: user.id,
          data: {
            roles: user.roles,
          },
        });
      },
    },
  }),
);
