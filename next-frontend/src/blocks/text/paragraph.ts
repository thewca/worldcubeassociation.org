import { Block } from "payload";
import { markdownConvertedField } from "@/collections/helpers";

export const ParagraphBlock: Block = {
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
