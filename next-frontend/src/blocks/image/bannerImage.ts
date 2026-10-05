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
      localized: true,
      admin: {
        description: "Heading shown next to the banner image.",
      },
    },
    {
      name: "body",
      type: "richText",
      localized: true,
      admin: {
        description: "Body text shown under the heading.",
      },
    },
    markdownConvertedField("body"),
    {
      name: "mainImage",
      type: "upload",
      relationTo: "media",
      required: true,
      admin: {
        description: "The image shown beside the text.",
      },
    },
    {
      name: "imagePosition",
      type: "radio",
      options: ["left", "right"],
      defaultValue: "left",
      required: true,
      admin: {
        layout: "horizontal",
        description: "Which side of the text the image sits on",
      },
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
      admin: {
        description:
          "Optional decorative image drawn behind the banner's content.",
      },
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
      admin: {
        description: "Which side of the banner the background image sits on",
      },
    },
  ],
};
