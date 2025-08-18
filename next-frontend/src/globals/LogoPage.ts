import { Block, GlobalConfig } from "payload";
import { markdownConvertedField } from "@/collections/helpers";

const paragraph: Block = {
  slug: "paragraph",
  labels: {
    singular: "Paragraph",
    plural: "Paragraphs",
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "content",
      type: "richText",
      required: true,
    },
    markdownConvertedField("content"),
  ],
};

const logoVariant: Block = {
  slug: "logoVariant",
  labels: {
    singular: "Logo Variant",
    plural: "Logo Variants",
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "caption",
      type: "text",
      required: true,
    },
    {
      name: "images",
      type: "array",
      required: true,
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
        },
      ],
    },
  ],
};

export const LogoPage: GlobalConfig = {
  slug: "logo-page",
  label: "Logo Page",
  fields: [
    {
      name: "blocks",
      type: "blocks",
      required: true,
      blocks: [paragraph, logoVariant],
    },
  ],
};
