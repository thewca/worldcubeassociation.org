import type { CollectionConfig } from "payload";
import { regulationsCommitteeAccess } from "@/payload.access";

export const RegulationsHistoryItem: CollectionConfig = {
  slug: "regulationsHistoryItem",
  access: {
    create: regulationsCommitteeAccess,
    update: regulationsCommitteeAccess,
    delete: regulationsCommitteeAccess,
  },
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
