import type { CollectionConfig } from "payload";

export const Testimonials: CollectionConfig = {
  slug: "testimonials",
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
    {
      name: "whoDunnit",
      type: "text",
      required: true,
    },
  ],
};
