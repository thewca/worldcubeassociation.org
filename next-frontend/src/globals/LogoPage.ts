import { Block, GlobalConfig } from "payload";
import { markdownConvertedField } from "@/collections/helpers";
import { revalidateGlobal } from "@/globals/revalidateGlobal";

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
      localized: true,
      admin: {
        description: "Optional heading shown above the paragraph.",
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

const downloadLink: Block = {
  slug: "logoDownload",
  labels: {
    singular: "Logo Download Box",
    plural: "Logo Download Boxes",
  },
  fields: [
    {
      name: "url",
      type: "text",
      required: true,
      admin: {
        description: "URL of the logo package the download button points to.",
      },
    },
  ],
};

const logoVariant: Block = {
  slug: "logoVariant",
  labels: {
    singular: "Logo Variant",
    plural: "Logo Variants",
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      localized: true,
      admin: {
        description: "Name of this logo variant.",
      },
    },
    {
      name: "caption",
      type: "text",
      required: true,
      localized: true,
      admin: {
        description: "Explains when this logo variant should be used.",
      },
    },
    {
      name: "logoOnly",
      type: "checkbox",
      label: "Logo only (render images at 150px)",
      admin: {
        description:
          "Tick this for variants without wordmark, so they are rendered smaller.",
      },
    },
    {
      name: "images",
      type: "array",
      required: true,
      admin: {
        description: "The files this variant is offered in.",
      },
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
          admin: {
            description: "The logo file to show.",
          },
        },
        {
          name: "darkBackground",
          type: "checkbox",
          admin: {
            description:
              "Tick this when the logo needs a dark backdrop to be visible.",
          },
        },
      ],
    },
  ],
};

export const LogoPage: GlobalConfig = {
  slug: "logo-page",
  label: "Logo Page",
  fields: [
    {
      name: "blocks",
      type: "blocks",
      required: true,
      blocks: [paragraph, logoVariant, downloadLink],
      admin: {
        description: "The sections making up the Logo page, top to bottom.",
      },
    },
  ],
  hooks: {
    afterChange: [revalidateGlobal],
  },
};
