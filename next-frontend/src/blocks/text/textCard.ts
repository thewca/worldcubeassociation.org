import { Block } from "payload";
import { markdownConvertedField } from "@/collections/helpers";
import { colorPaletteSelect } from "@/blocks/utils";

export const TextCardBlock: Block = {
  slug: "TextCard",
  interfaceName: "TextCardBlock",
  imageURL: "/payload/text_card.png",
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
    },
    {
      name: "body",
      type: "richText",
      required: true,
    },
    markdownConvertedField("body"),
    {
      name: "separatorAfterHeading",
      type: "checkbox",
      required: true,
      defaultValue: false,
    },
    {
      name: "buttonText",
      type: "text",
      required: false,
    },
    {
      name: "buttonLink",
      type: "text",
      required: false,
    },
    {
      name: "headerImage",
      type: "upload",
      relationTo: "media",
    },
    colorPaletteSelect,
  ],
};
