import type { CollectionConfig } from "payload";

export const RegulationsHistoryItem: CollectionConfig = {
  slug: "regulationsHistoryItem",
  fields: [
    {
      name: "version",
      type: "text",
      required: true,
      admin: {
        description:
          "Version identifier of this Regulations release, for example '2024'.",
      },
    },
    {
      name: "url",
      type: "text",
      required: true,
      admin: {
        description: "URL of the Regulations at this version.",
      },
    },
    {
      name: "changesUrl",
      type: "text",
      admin: {
        description:
          "Optional. URL of the full list of changes introduced by this version.",
      },
    },
    {
      name: "summarizedChangesUrl",
      type: "text",
      admin: {
        description:
          "Optional. URL of the summary of changes introduced by this version.",
      },
    },
  ],
  admin: {
    useAsTitle: "version",
  },
};
