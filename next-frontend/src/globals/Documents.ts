import { GlobalConfig } from "payload";
import { revalidateGlobal } from "@/globals/revalidateGlobal";

export const DocumentsPage: GlobalConfig = {
  slug: "documents-page",
  label: "Documents Page",
  fields: [
    {
      type: "array",
      label: "documents",
      name: "documents",
      required: true,
      admin: {
        description:
          "The documents listed on the Documents page, in the order they appear.",
      },
      fields: [
        {
          name: "document",
          relationTo: "documents",
          type: "relationship",
          required: true,
          admin: {
            description: "The document to list here.",
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateGlobal],
  },
};
