import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  admin: {
    useAsTitle: "alt",
  },
  slug: "media",
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
    {
      name: "customLink",
      label: "Custom Link",
      type: "text",
    },
  ],
  upload: true,
};
