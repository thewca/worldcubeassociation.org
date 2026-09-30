import { Block, GlobalConfig } from "payload";
import { markdownConvertedField } from "@/collections/helpers";
import { QuoteBlock } from "@/blocks/text/quote";
import { newTabCheckbox } from "@/blocks/utils";
import { revalidateGlobal } from "@/globals/revalidateGlobal";

const callToActionBlock: Block = {
  slug: "callToAction",
  labels: {
    singular: "Call to Action",
    plural: "Calls to Action",
  },
  fields: [
    {
      name: "content",
      type: "richText",
      required: true,
      localized: true,
      admin: {
        description: "Text shown above the buttons.",
      },
    },
    markdownConvertedField("content"),
    {
      name: "buttons",
      type: "array",
      required: true,
      admin: {
        description: "The buttons offered under the text.",
      },
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
          localized: true,
          admin: {
            description: "Label written on the button.",
          },
        },
        {
          name: "url",
          type: "text",
          required: true,
          admin: {
            description: "URL the button links to.",
          },
        },
        newTabCheckbox,
      ],
    },
  ],
};

const simpleItemBlock: Block = {
  slug: "simpleItem",
  labels: {
    singular: "Simple Item",
    plural: "Simple Items",
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      localized: true,
      admin: {
        description: "Heading of this section of the About Us page.",
      },
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      required: false,
      admin: {
        description: "Optional image shown alongside the text.",
      },
    },
    {
      name: "content",
      type: "richText",
      required: true,
      localized: true,
      admin: {
        description: "Body text of this section.",
      },
    },
    markdownConvertedField("content"),
  ],
};

export const AboutUsPage: GlobalConfig = {
  slug: "about-us-page",
  label: "About Us Page",
  fields: [
    {
      name: "blocks",
      type: "blocks",
      required: true,
      blocks: [callToActionBlock, simpleItemBlock, QuoteBlock],
      admin: {
        description: "The sections making up the About Us page, top to bottom.",
      },
    },
  ],
  hooks: {
    afterChange: [revalidateGlobal],
  },
};
