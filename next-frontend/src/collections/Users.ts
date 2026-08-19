import type { CollectionConfig } from "payload";
import { betterAuthStrategy } from "@delmaredigital/payload-better-auth";

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "name",
  },
  auth: {
    // Nobody signs in to Payload with a password — the only way in is the `cms`-scoped WCA
    //   OIDC provider, which is what keeps this collection limited to CMS operators.
    disableLocalStrategy: true,
    // `idType: "text"` is what the adapter expects on MongoDB, where ids are ObjectId strings.
    //   The default assumes Postgres SERIAL and coerces ids to numbers.
    strategies: [betterAuthStrategy({ idType: "text" })],
  },
  fields: [
    // A custom text ID rather than Mongo's default ObjectId, because the rows this collection
    //   already holds were written by payload-authjs with string UUID ids. Keeping the same
    //   shape means existing CMS users (and anything pointing at them, like an announcement's
    //   author) survive the move to Better Auth.
    //
    // The adapter hardcodes `disableIdGeneration: true`, so Better Auth never supplies an id
    //   and Payload will not invent one for a custom ID field — hence the explicit default.
    {
      name: "id",
      type: "text",
      defaultValue: () => crypto.randomUUID(),
    },
    // Better Auth's core user fields. They live here rather than being generated because
    //   `betterAuthCollections` is told to skip `user` so this hand-written config wins.
    {
      name: "email",
      type: "email",
      required: true,
      unique: true,
    },
    {
      name: "emailVerified",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "name",
      type: "text",
    },
    {
      name: "image",
      type: "text",
    },
    {
      name: "wcaId",
      type: "text",
      admin: {
        hidden: true,
      },
    },
    {
      name: "wcaUserId",
      type: "number",
      admin: {
        hidden: true,
      },
    },
    {
      name: "roles",
      type: "json",
      // Roles mirror the WCA teams from the OIDC `roles` claim. Better Auth's adapter writes
      //   them with `overrideAccess: true`, so denying every ordinary write here stops a user
      //   from granting themselves a team through Payload's REST/GraphQL API.
      access: {
        create: () => false,
        update: () => false,
      },
      jsonSchema: {
        uri: "a://b/foo.json", // required
        fileMatch: ["a://b/foo.json"], // required
        schema: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },
      admin: {
        hidden: true,
      },
    },
  ],
  access: {
    // The only way a user record comes into existence is the `cms`-scoped OIDC login, which
    //   goes through Better Auth's adapter and bypasses access control. Denying `create`
    //   outright closes Payload's auto-generated `POST /api/payload/users` route, which would
    //   otherwise be an unauthenticated way to mint a user.
    create: () => false,
    admin: ({ req: { user } }) => {
      return ["wst", "wct", "wat", "wmt", "board"].some((team) =>
        user?.roles?.includes(team),
      );
    },
    read: ({ req: { user } }) => {
      if (!user) {
        return false;
      }

      if (user.roles?.includes("wst_admin")) {
        // Admins are allowed to see all users
        return true;
      }

      return {
        // Only allow to read the current user, ie "yourself"
        id: {
          equals: user.id,
        },
      };
    },
  },
};
