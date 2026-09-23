import type { CollectionConfig } from "payload";
import { markdownConvertedField } from "@/collections/helpers";

export const Testimonials: CollectionConfig = {
  slug: "testimonials",
  fields: [
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      admin: {
        description: "Picture of the person being quoted.",
      },
    },
    {
      name: "punchline",
      type: "text",
      required: true,
      localized: true,
      admin: {
        description:
          "Short pull quote shown on the testimonials spinner before the full testimonial is opened.",
      },
    },
    {
      name: "fullTestimonial",
      type: "richText",
      required: true,
      localized: true,
      admin: {
        description: "The complete testimonial in the person's own words.",
      },
    },
    markdownConvertedField("fullTestimonial"),
    {
      name: "whoDunnit",
      type: "text",
      required: true,
      admin: {
        description: "Name of the person being quoted.",
      },
    },
  ],
};
