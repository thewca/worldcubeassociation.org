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

export const AboutRegulations: GlobalConfig = {
  slug: "about-regulations-page",
  label: "About Regulations Page",
  fields: [
    {
      name: "blocks",
      type: "blocks",
      required: true,
      blocks: [paragraph],
    },
  ],
};
