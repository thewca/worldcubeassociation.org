import { CollectionConfig } from "payload";

export const Tool: CollectionConfig = {
  slug: "tool",
  labels: {
    singular: "Tool",
    plural: "Tools",
  },
  admin: {
    useAsTitle: "name",
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "description",
      type: "text",
      required: true,
    },
    {
      name: "toolLink",
      type: "text",
      required: true,
    },
    {
      name: "guideLink",
      type: "text",
    },
    {
      name: "sourceLink",
      type: "text",
    },
    {
      name: "category",
      type: "select",
      options: [
        {
          label: "Before the competition",
          value: "before",
        },
        {
          label: "During the competition",
          value: "during",
        },
        {
          label: "After the competition",
          value: "after",
        },
      ],
    },
  ],
};
