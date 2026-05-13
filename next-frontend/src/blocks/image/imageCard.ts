import { Block } from "payload";
import { colorPaletteSelect } from "@/blocks/utils";

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
    },
    {
      name: "heading",
      type: "text",
    },
    colorPaletteSelect,
  ],
};
