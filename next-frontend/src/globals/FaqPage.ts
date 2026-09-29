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
    },
    markdownConvertedField("introText"),
    {
      type: "array",
      label: "questions",
      name: "questions",
      required: true,
      fields: [
        {
          name: "faqQuestion",
          relationTo: "faqQuestions",
          type: "relationship",
          required: true,
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateGlobal],
  },
};
