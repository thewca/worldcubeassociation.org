import type { CollectionConfig } from "payload";
import { markdownConvertedField } from "@/collections/helpers";

export const Announcements: CollectionConfig = {
  slug: "announcements",
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
      name: "image",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      // equivalent to body for Post
      name: "content",
      type: "richText",
      required: true,
    },
    markdownConvertedField("content"),
    {
      name: "publishAt",
      admin: {
        description: "The date the announcement will be published",
      },
      type: "date",
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
      // equivalent to authorName for Post
      name: "publishedBy",
      type: "relationship",
      relationTo: "users",
      required: true,
    },
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
