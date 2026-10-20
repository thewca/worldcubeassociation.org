import type { CollectionConfig } from "payload";
import { markdownConvertedField } from "@/collections/helpers";
import { marketingTeamAccess } from "@/payload.access";

export const Testimonials: CollectionConfig = {
  slug: "testimonials",
  access: {
    create: marketingTeamAccess,
    update: marketingTeamAccess,
    delete: marketingTeamAccess,
  },
  fields: [
    {
      name: "image",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "punchline",
      type: "text",
      required: true,
    },
    {
      name: "fullTestimonial",
      type: "richText",
      required: true,
    },
    markdownConvertedField("fullTestimonial"),
    {
      name: "whoDunnit",
      type: "text",
      required: true,
    },
  ],
};
