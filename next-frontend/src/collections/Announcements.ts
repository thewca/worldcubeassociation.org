import type { CollectionConfig } from "payload";
import { markdownConvertedField } from "@/collections/helpers";
import { canCreatePosts } from "@/payload.access";

export const Announcements: CollectionConfig = {
  slug: "announcements",
  access: {
    create: canCreatePosts,
    update: canCreatePosts,
    delete: canCreatePosts,
  },
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
