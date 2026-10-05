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
      admin: {
        description: "Name of the tool.",
      },
    },
    {
      name: "description",
      type: "text",
      required: true,
      localized: true,
      admin: {
        description:
          "One line explaining what the tool does, shown on its card on the score tools page.",
      },
    },
    {
      name: "homepageLink",
      type: "text",
      required: true,
      admin: {
        description: "URL of the tool's homepage.",
      },
    },
    {
      name: "guideLink",
      type: "text",
      admin: {
        description: "Optional. URL of a guide on how to use the tool.",
      },
    },
    {
      name: "sourceCodeLink",
      type: "text",
      admin: {
        description: "Optional. URL of the tool's source code repository.",
      },
    },
    {
      name: "isOfficial",
      type: "checkbox",
      admin: {
        description: "Whether this tool is maintained by the WCA.",
      },
    },
    {
      name: "author",
      type: "text",
      required: true,
      admin: {
        description: "Name of the person or team that maintains the tool.",
      },
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
      admin: {
        description:
          "Stage of a competition the tool is used in, used to group the tools.",
      },
    },
  ],
};
