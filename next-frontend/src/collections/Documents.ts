import { CollectionConfig } from "payload";
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

export const Documents: CollectionConfig = {
  slug: "documents",
  labels: {
    singular: "Document",
    plural: "Documents",
  },
  admin: {
    useAsTitle: "title",
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
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
};
