import { Block } from "payload";

export const CaptionedImageBlock: Block = {
  slug: "captionedImage",
  labels: {
    singular: "Captioned Image",
    plural: "Captioned Images",
  },
  fields: [
    {
      name: "caption",
      type: "text",
      required: true,
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      required: true,
    },
  ],
};
