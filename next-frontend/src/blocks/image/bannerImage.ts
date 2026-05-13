import { Block } from "payload";
import { markdownConvertedField } from "@/collections/helpers";
import { colorPaletteSelect, colorPaletteToneToggle } from "@/blocks/utils";

export const BannerImageBlock: Block = {
  slug: "ImageBanner",
  interfaceName: "ImageBannerBlock",
  imageURL: "/payload/image_banner.png",
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
      name: "mainImage",
      type: "upload",
      relationTo: "media",
      required: true,
    },
    colorPaletteSelect,
    colorPaletteToneToggle,
    {
      ...colorPaletteSelect,
      name: "headingColor",
      required: false,
      admin: {
        description:
          "Color for the heading. Will follow the overall color palette by default, only use this field if you want to purposely override (for example, to achieve a more striking contrast that garners attention)",
      },
    },
    {
      name: "bgImage",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "bgSize",
      type: "number",
      min: 10,
      max: 100,
      defaultValue: 100,
      required: true,
      admin: {
        description: "The size of the background image in percent (%)",
      },
    },
    {
      name: "bgPos",
      type: "select",
      options: ["right", "left"],
      defaultValue: "right",
      required: true,
    },
  ],
};
