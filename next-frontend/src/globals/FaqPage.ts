import { GlobalConfig } from "payload";
import { markdownConvertedField } from "@/collections/helpers";
import { revalidateGlobal } from "@/globals/revalidateGlobal";

export const FaqPage: GlobalConfig = {
  slug: "faq-page",
  label: "Faq Page",
  fields: [
    {
      name: "introText",
      type: "richText",
      localized: true,
      admin: {
        description: "Text shown above the list of questions on the FAQ page.",
      },
    },
    markdownConvertedField("introText"),
    {
      type: "array",
      label: "questions",
      name: "questions",
      required: true,
      admin: {
        description:
          "The questions listed on the FAQ page, in the order they appear.",
      },
      fields: [
        {
          name: "faqQuestion",
          relationTo: "faqQuestions",
          type: "relationship",
          required: true,
          admin: {
            description: "The question to list here.",
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateGlobal],
  },
};
