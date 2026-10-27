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
      localized: true,
      admin: {
        description: "Heading shown above the paragraph.",
      },
    },
    {
      name: "content",
      type: "richText",
      required: true,
      localized: true,
      admin: {
        description: "Body text of the paragraph.",
      },
    },
    markdownConvertedField("content"),
  ],
};
