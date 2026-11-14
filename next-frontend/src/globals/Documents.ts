import { GlobalConfig } from "payload";
import { revalidateGlobal } from "@/globals/revalidateGlobal";
import { qualityTeamAccess } from "@/payload.access";
import { iconMap, IconName } from "@/components/icons/iconMap";

const iconOptions = Object.keys(iconMap) as IconName[];

const documentCategories = [
  {
    value: "motions",
    label: "Motions",
  },
  {
    value: "minutes",
    label: "Minutes",
  },
  {
    value: "policies",
    label: "WCA Policies",
  },
  {
    value: "finances",
    label: "Finances",
  },
];

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
      admin: {
        description:
          "The documents listed on the Documents page, in the order they appear.",
      },
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
          localized: true,
          admin: {
            description: "Name of the document, shown as the link text.",
          },
        },
        {
          name: "icon",
          type: "select",
          options: iconOptions,
          interfaceName: "IconName",
          required: true,
          admin: {
            description: "Icon name",
          },
        },
        {
          name: "link",
          type: "text",
          required: true,
          admin: {
            description: "URL the document links to.",
          },
        },
        {
          name: "category",
          type: "select",
          options: documentCategories,
          admin: {
            description: "Category name (used for grouping documents)",
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateGlobal],
  },
};
