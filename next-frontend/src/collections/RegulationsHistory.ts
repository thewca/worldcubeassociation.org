import type { CollectionConfig } from "payload";

export const RegulationsHistoryItem: CollectionConfig = {
  slug: "regulationsHistoryItem",
  fields: [
    {
      name: "version",
      type: "text",
      required: true,
    },
    {
      name: "url",
      type: "text",
      required: true,
    },
    {
      name: "changesUrl",
      type: "text",
    },
    {
      name: "summarizedChangesUrl",
      type: "text",
    },
  ],
  admin: {
    useAsTitle: "version",
  },
};
