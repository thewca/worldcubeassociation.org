import { CollectionConfig } from "payload";
import { markdownConvertedField } from "@/collections/helpers";
import { colorPaletteSelect } from "@/blocks/utils";
import { qualityTeamAccess } from "@/payload.access";

export const FaqCategories: CollectionConfig = {
  slug: "faqCategories",
  access: {
    create: qualityTeamAccess,
    update: qualityTeamAccess,
    delete: qualityTeamAccess,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    colorPaletteSelect,
    {
      name: "relatedQuestions",
      type: "join",
      collection: "faqQuestions",
      on: "category",
    },
  ],
  admin: {
    useAsTitle: "title",
  },
};

export const FaqQuestions: CollectionConfig = {
  slug: "faqQuestions",
  access: {
    create: qualityTeamAccess,
    update: qualityTeamAccess,
    delete: qualityTeamAccess,
  },
  fields: [
    {
      name: "category",
      type: "relationship",
      relationTo: "faqCategories",
      required: true,
    },
    {
      name: "question",
      type: "text",
      required: true,
    },
    {
      name: "answer",
      type: "textarea",
      required: true,
    },
    {
      name: "answerRichtext",
      type: "richText",
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
