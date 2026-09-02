import type { CollectionConfig } from "payload";
import { markdownConvertedField } from "@/collections/helpers";

export const Announcements: CollectionConfig = {
  slug: "announcements",
  admin: {
    useAsTitle: "title",
  },
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
      name: "summary",
      type: "textarea",
      maxLength: 400,
      admin: {
        description:
          "Shown on the announcements list before 'Read More'. Falls back to the beginning of the content when empty.",
      },
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
