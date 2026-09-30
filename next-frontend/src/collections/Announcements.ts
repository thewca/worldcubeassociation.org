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
      admin: {
        description:
          "Header image shown next to the announcement on the announcements list and at the top of the announcement itself.",
      },
    },
    {
      name: "title",
      type: "text",
      required: true,
      localized: true,
      admin: {
        description:
          "Headline of the announcement, shown on the announcements list and as the page title.",
      },
    },
    {
      name: "summary",
      type: "textarea",
      maxLength: 400,
      localized: true,
      admin: {
        description:
          "Shown on the announcements list before 'Read More'. Falls back to the beginning of the content when empty.",
      },
    },
    {
      name: "content",
      type: "richText",
      required: true,
      localized: true,
      admin: {
        description: "Full body of the announcement.",
      },
    },
    markdownConvertedField("content"),
    {
      name: "publishedAt",
      type: "date",
      required: true,
      admin: {
        description:
          "Date the announcement was published, used to sort the announcements list.",
      },
    },
    {
      name: "publishedBy",
      type: "relationship",
      relationTo: "users",
      required: true,
      admin: {
        description: "WCA user credited as the author of the announcement.",
      },
    },
  ],
};
