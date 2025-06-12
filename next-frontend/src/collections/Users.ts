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
      //virtual: true,
    },
  ],
  access: {
    admin: ({ req }) => {
      const user = req.user;
      console.log('Payload auth check!', user, user?.roles);

      // proof-of-concept: Log in as 2012BILL01 to see the "unauthorized" message
      const wcaAccount = user?.accounts?.find((acc) => acc.provider === "WCA");
      return wcaAccount?.providerAccountId === "7121";
    },
  },
};
