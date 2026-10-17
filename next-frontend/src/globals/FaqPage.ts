import { GlobalConfig } from "payload";
import { markdownConvertedField } from "@/collections/helpers";
import { revalidateGlobal } from "@/globals/revalidateGlobal";
import { qualityTeamAccess } from "@/payload.access";

export const FaqPage: GlobalConfig = {
  slug: "faq-page",
  access: {
    update: qualityTeamAccess,
  },
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
