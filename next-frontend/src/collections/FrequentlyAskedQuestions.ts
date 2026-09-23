import { CollectionConfig } from "payload";
import { markdownConvertedField } from "@/collections/helpers";
import { colorPaletteSelect } from "@/blocks/utils";

export const FaqCategories: CollectionConfig = {
  slug: "faqCategories",
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      localized: true,
      admin: {
        description:
          "Name of the category, shown as the heading above its questions on the FAQ page.",
      },
    },
    colorPaletteSelect,
    {
      name: "relatedQuestions",
      type: "join",
      collection: "faqQuestions",
      on: "category",
      admin: {
        description:
          "Questions that point at this category. Filled in automatically, edit the question to change it.",
      },
    },
  ],
  admin: {
    useAsTitle: "title",
  },
};

export const FaqQuestions: CollectionConfig = {
  slug: "faqQuestions",
  fields: [
    {
      name: "category",
      type: "relationship",
      relationTo: "faqCategories",
      required: true,
      admin: {
        description: "Category this question is grouped under on the FAQ page.",
      },
    },
    {
      name: "question",
      type: "text",
      required: true,
      localized: true,
      admin: {
        description:
          "The question as asked, shown as the clickable heading of the FAQ entry.",
      },
    },
    {
      name: "answer",
      type: "textarea",
      required: true,
      localized: true,
      admin: {
        description:
          "Plain text answer. Used when the rich text answer below is empty.",
      },
    },
    {
      name: "answerRichtext",
      type: "richText",
      localized: true,
      admin: {
        description:
          "Formatted answer. Takes precedence over the plain text answer above.",
      },
    },
    markdownConvertedField("answerRichtext"),
  ],
  admin: {
    useAsTitle: "question",
    livePreview: {
      url: "/faq",
    },
  },
};
