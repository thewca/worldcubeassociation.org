import { CollectionConfig } from "payload";
import { markdownConvertedField } from "@/collections/helpers";

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: {
    useAsTitle: "title",
  },
  fields: [
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "sticky",
      type: "checkbox",
    },
    {
      name: "unstickAt",
      type: "date",
      required: false,
    },
    {
      name: "author name",
      type: "text",
      required: true,
    },
    {
      name: "body",
      type: "richText",
      required: true,
    },
    markdownConvertedField("body"),
    {
      name: "approvedBy",
      type: "relationship",
      relationTo: "users",
      access: {
        create: ({ req: { user } }) => {
          return user?.roles?.includes("wct") === true;
        },
        update: ({ req: { user } }) => {
          return user?.roles?.includes("wct") === true;
        },
        read: () => {
          return true;
        },
      },
    },
  ],
};
