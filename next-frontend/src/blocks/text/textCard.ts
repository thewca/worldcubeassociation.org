import { Block } from "payload";
import { markdownConvertedField } from "@/collections/helpers";
import { colorPaletteSelect, newTabCheckbox } from "@/blocks/utils";

const actionButtonBlock: Block = {
  slug: "actionButton",
  interfaceName: "BentoActionButton",
  fields: [
    {
      name: "displayText",
      type: "text",
      required: true,
      localized: true,
      admin: {
        description: "Label written on the button.",
      },
    },
    {
      name: "hyperlink",
      type: "text",
      required: true,
      admin: {
        description: "URL the button links to.",
      },
    },
    newTabCheckbox,
    {
      name: "inheritColorScheme",
      type: "checkbox",
      required: true,
      defaultValue: false,
      admin: {
        description:
          "Buttons are solid blue by default. If you click this checkbox, their color will follow the original text box instead",
      },
    },
  ],
};

export const TextCardBlock: Block = {
  slug: "TextCard",
  interfaceName: "TextCardBlock",
  imageURL: "/payload/text_card.png",
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
      localized: true,
      admin: {
        description: "Heading shown at the top of the card.",
      },
    },
    {
      name: "body",
      type: "richText",
      required: true,
      localized: true,
      admin: {
        description: "Body text of the card, shown under the heading.",
      },
    },
    markdownConvertedField("body"),
    {
      name: "separatorAfterHeading",
      type: "checkbox",
      required: true,
      defaultValue: false,
      admin: {
        description: "Draw a horizontal line between the heading and the body",
      },
    },
    {
      name: "buttons",
      type: "blocks",
      blocks: [actionButtonBlock],
      minRows: 0,
      maxRows: 1,
      admin: {
        description: "Optional call-to-action button shown below the body.",
      },
    },
    {
      name: "headerImage",
      type: "upload",
      relationTo: "media",
      admin: {
        description: "Optional image shown above the heading.",
      },
    },
    colorPaletteSelect,
  ],
};
