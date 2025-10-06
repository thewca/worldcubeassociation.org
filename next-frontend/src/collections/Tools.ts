import { CollectionConfig } from "payload";

export const Tools: CollectionConfig = {
  slug: "tools",
  admin: {
    useAsTitle: "name",
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "description",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "homepageLink",
      type: "text",
      required: true,
    },
    {
      name: "guideLink",
      type: "text",
    },
    {
      name: "sourceCodeLink",
      type: "text",
    },
    {
      name: "isOfficial",
      type: "checkbox",
    },
    {
      name: "author",
      type: "text",
      required: true,
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
      required: true,
    },
  ],
};
