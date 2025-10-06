import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "name",
  },
  fields: [
    {
      name: "roles",
      type: "json",
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
