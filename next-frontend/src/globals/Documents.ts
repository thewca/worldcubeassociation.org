import { GlobalConfig } from "payload";

export const DocumentsPage: GlobalConfig = {
  slug: "documents-page",
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
};
