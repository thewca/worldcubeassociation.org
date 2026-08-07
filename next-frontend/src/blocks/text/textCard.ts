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
    },
    {
      name: "hyperlink",
      type: "text",
      required: true,
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
    },
    {
      name: "body",
      type: "richText",
      required: true,
      localized: true,
    },
    markdownConvertedField("body"),
    {
      name: "separatorAfterHeading",
      type: "checkbox",
      required: true,
      defaultValue: false,
    },
    {
      name: "buttons",
      type: "blocks",
      blocks: [actionButtonBlock],
      minRows: 0,
      maxRows: 1,
    },
    {
      name: "headerImage",
      type: "upload",
      relationTo: "media",
    },
    colorPaletteSelect,
  ],
};
