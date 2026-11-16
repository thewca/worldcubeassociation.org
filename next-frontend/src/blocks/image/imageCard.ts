import { Block } from "payload";
import { colorPaletteSelect, newTabCheckbox } from "@/blocks/utils";

export const ImageCardBlock: Block = {
  slug: "ImageOnlyCard",
  interfaceName: "ImageOnlyCardBlock",
  imageURL: "/payload/image_only_card.png",
  fields: [
    {
      name: "mainImage",
      type: "upload",
      relationTo: "media",
      required: true,
      admin: {
        description: "The image filling the card.",
      },
    },
    {
      name: "heading",
      type: "text",
      localized: true,
      admin: {
        description: "Optional caption shown over the image.",
      },
    },
    {
      name: "url",
      type: "text",
      admin: {
        description:
          "Optional. If set, the whole card becomes a link to this URL.",
      },
    },
    newTabCheckbox,
    {
      name: "textPosition",
      type: "radio",
      options: ["top", "bottom"],
      defaultValue: "top",
      admin: {
        layout: "horizontal",
        description: "Whether the caption sits above or below the image",
      },
    },
    colorPaletteSelect,
  ],
};
