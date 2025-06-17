import { GlobalConfig } from "payload";
import { markdownConvertedField } from "@/collections/helpers";

export const AboutUsPage: GlobalConfig = {
  slug: "about-us-page",
  label: "About Us Page",
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "blocks",
      type: "blocks",
      required: true,
      blocks: [
        {
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
            },
            markdownConvertedField("content"),
            {
              name: "buttons",
              type: "array",
              required: true,
              fields: [
                {
                  name: "label",
                  type: "text",
                  required: true,
                },
                {
                  name: "url",
                  type: "text",
                  required: true,
                },
              ],
            },
          ],
        },
        {
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
            },
            {
              name: "image",
              type: "upload",
              relationTo: "media",
              required: false,
            },
            {
              name: "content",
              type: "richText",
              required: true,
            },
            markdownConvertedField("content"),
          ],
        },
        {
          slug: "quote",
          labels: {
            singular: "Quote",
            plural: "Quotes",
          },
          fields: [
            {
              name: "content",
              type: "richText",
              required: true,
            },
            markdownConvertedField("content"),
            {
              name: "quotedPerson",
              type: "text",
              required: true,
              label: "Who is quoted",
            },
          ],
        },
      ],
    },
  ],
};
