import type { CollectionConfig } from "payload";
import { DateTime } from "luxon";
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
      label: "Scheduled release",
      type: "date",
      required: true,
      admin: {
        date: { pickerAppearance: "dayAndTime" },
        description:
          "The announcement stays hidden until this moment. Also used to sort the announcements list, newest first.",
      },
    },
    {
      name: "isPinned",
      label: "Pinned",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description:
          "Pinned announcements are listed before all others, most recently pinned first.",
      },
    },
    {
      name: "pinnedAt",
      type: "date",
      admin: {
        position: "sidebar",
        readOnly: true,
        date: { pickerAppearance: "dayAndTime" },
        condition: (data) => Boolean(data.isPinned),
      },
      hooks: {
        // Only stamp when the pin is newly set, so re-saving a pinned announcement keeps its place.
        beforeChange: [
          ({ siblingData, originalDoc }) => {
            if (!siblingData.isPinned) return null;

            return originalDoc?.pinnedAt ?? DateTime.now().toISO();
          },
        ],
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
