import type { CollectionConfig } from "payload";
import { markdownConvertedField } from "@/collections/helpers";

export const Announcements: CollectionConfig = {
  slug: "announcements",
  fields: [
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
      name: "content",
      type: "richText",
      required: true,
    },
    markdownConvertedField("content"),
    {
      name: "publishedAt",
      type: "date",
      required: true,
    },
    {
      name: "publishedBy",
      type: "relationship",
      relationTo: "users",
      required: true,
    },
  ],
};
