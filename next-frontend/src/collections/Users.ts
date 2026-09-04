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
    // `email`, `emailVerified`, `image`, `wcaId` and `wcaUserId` are deliberately absent:
    //   `betterAuthCollections` augments this collection with every schema field it does not
    //   already find here, so declaring them again would only duplicate the generated shape.
    //   The two below stay hand-written because augmentation cannot express them.
    // Better Auth marks `name` required, but rows written by payload-authjs may have none, and
    //   a required field would fail validation on their next write.
    {
      name: "name",
      type: "text",
    },
    {
      name: "roles",
      type: "json",
      // Better Auth 1.7 split `supportsArrays` out of `supportsJSON` @delmaredigital/payload-better-auth is at 0.11.3 (latest)
      // and hardcodes supportsArrays: false so a `string[]` field arrives here JSON-encoded and the `json` field's
      // schema rejects it. Decode it back into the array the rest of the app expects.
      hooks: {
        beforeValidate: [
          ({ value }) =>
            typeof value === "string" ? JSON.parse(value) : value,
        ],
      },
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
