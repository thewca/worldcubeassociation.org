import { CollectionConfig } from "payload";
import { markdownConvertedField } from "@/collections/helpers";

export const AboutUsItem: CollectionConfig = {
  slug: "aboutUsItem",
  fields: [
    {
      name: "image",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "title",
      type: "text",
    },
    {
      name: "content",
      type: "richText",
      required: true,
    },
    markdownConvertedField("content"),
  ],
};
