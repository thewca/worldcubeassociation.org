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
      localized: true,
      admin: {
        description: "Caption shown underneath the image.",
      },
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      required: true,
      admin: {
        description: "The image to show.",
      },
    },
  ],
};
