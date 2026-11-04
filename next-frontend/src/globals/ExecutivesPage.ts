import { GlobalConfig } from "payload";
import { markdownConvertedField } from "@/collections/helpers";
import { colorPaletteSelect } from "@/blocks/utils";
import { revalidateGlobal } from "@/globals/revalidateGlobal";
import { marketingTeamAccess } from "@/payload.access";

export const ExecutivesPage: GlobalConfig = {
  slug: "executives-page",
  access: {
    update: marketingTeamAccess,
  },
  label: "Executives Page",
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      localized: true,
      admin: {
        description: "Heading shown at the top of the Executives page.",
      },
    },
    {
      name: "intro",
      type: "richText",
      required: true,
      localized: true,
      admin: {
        description: "Paragraph shown below the heading.",
      },
    },
    markdownConvertedField("intro"),
    {
      name: "showsImages",
      type: "checkbox",
      required: true,
      defaultValue: false,
      admin: {
        description: "Show the profile picture on every executive's card.",
      },
    },
    {
      name: "executives",
      type: "array",
      required: true,
      admin: {
        description: "The executives shown on the page, in order.",
      },
      fields: [
        {
          name: "wcaId",
          type: "text",
          required: true,
          admin: {
            description:
              "WCA ID of the executive. Name, region and stats are loaded from their profile.",
          },
        },
        {
          name: "role",
          type: "text",
          required: true,
          localized: true,
          admin: {
            description: "Title of the executive, e.g. Chairperson.",
          },
        },
        {
          name: "joinedWcaYear",
          type: "number",
          required: true,
          admin: {
            description: "Year this person joined the WCA.",
          },
        },
        {
          name: "joinedExecutivesYear",
          type: "number",
          required: true,
          admin: {
            description: "Year this person joined the Executives team.",
          },
        },
        {
          name: "summary",
          type: "textarea",
          required: true,
          localized: true,
          admin: {
            description: "Short bio shown on the card.",
          },
        },
        {
          name: "bio",
          type: "richText",
          required: true,
          localized: true,
          admin: {
            description: 'Full bio shown when clicking "More Information".',
          },
        },
        markdownConvertedField("bio"),
        colorPaletteSelect,
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateGlobal],
  },
};
