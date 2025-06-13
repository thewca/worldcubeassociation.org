import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",
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
    admin: ({ req }) => {
      const user = req.user;

      return user?.roles?.includes("wst") === true;
    },
  },
};
