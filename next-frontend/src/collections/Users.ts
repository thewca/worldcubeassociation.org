import type { CollectionConfig } from "payload";
import { betterAuthStrategy } from "@delmaredigital/payload-better-auth";

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "name",
  },
  auth: {
    disableLocalStrategy: true,
    // `idType: "text"` for MongoDB; the default assumes Postgres SERIAL and coerces to numbers.
    strategies: [betterAuthStrategy({ idType: "text" })],
  },
  fields: [
    // Text ID rather than Mongo's ObjectId, because the rows already here were written by
    //   payload-authjs with string UUIDs and keeping the shape lets them (and their references)
    //   survive. The adapter hardcodes `disableIdGeneration: true` and Payload does not fill in
    //   custom IDs, so nothing supplies a value without this default.
    {
      name: "id",
      type: "text",
      defaultValue: () => crypto.randomUUID(),
    },
    // Better Auth's core fields, hand-written because `betterAuthCollections` skips `user`.
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
      // The adapter writes with `overrideAccess: true`, so denying ordinary writes stops a
      //   user granting themselves a team through Payload's REST/GraphQL API.
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
    // Don't allow any creation or updates to users in Payload. Rails should stay
    // the source of truth
    create: () => false,
    update: () => false,
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
