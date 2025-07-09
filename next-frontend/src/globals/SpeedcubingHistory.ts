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
      name: "content",
      type: "richText",
      required: true,
    },
    markdownConvertedField("content"),
  ],
};

const captionedImage: Block = {
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

const quoute: Block = {
  slug: "quote",
  labels: {
    singular: "Quote",
    plural: "Quotes",
  },
  fields: [
    {
      name: "content",
      type: "richText",
      required: true,
    },
    markdownConvertedField("content"),
    {
      name: "quotedPerson",
      type: "text",
      required: true,
      label: "Who is quoted",
    },
  ],
};

export const SpeedCubingHistoryPage: GlobalConfig = {
  slug: "speedcubing-history-page",
  label: "Speedcubing History Page",
  fields: [
    {
      name: "blocks",
      type: "blocks",
      required: true,
      blocks: [paragraph, captionedImage, quoute],
    },
  ],
};
