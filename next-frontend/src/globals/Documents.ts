import { GlobalConfig } from "payload";
import { revalidateGlobal } from "@/globals/revalidateGlobal";
import { qualityTeamAccess } from "@/payload.access";

export const DocumentsPage: GlobalConfig = {
  slug: "documents-page",
  access: {
    update: qualityTeamAccess,
  },
  label: "Documents Page",
  fields: [
    {
      type: "array",
      label: "documents",
      name: "documents",
      required: true,
      fields: [
        {
          name: "document",
          relationTo: "documents",
          type: "relationship",
          required: true,
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateGlobal],
  },
};
