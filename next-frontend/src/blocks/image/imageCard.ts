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
    {
      name: "url",
      type: "text",
      admin: {
        description:
          "Optional. If set, the whole card becomes a link to this URL.",
      },
    },
    {
      name: "textPosition",
      type: "radio",
      options: ["top", "bottom"],
      defaultValue: "top",
      admin: {
        layout: "horizontal",
      },
    },
    colorPaletteSelect,
  ],
};
