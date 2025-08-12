import { Block, CheckboxField, GlobalConfig, SelectField } from "payload";
import { markdownConvertedField } from "@/collections/helpers";

const colorPaletteSelect: SelectField = {
  name: "colorPalette",
  type: "select",
  required: true,
  interfaceName: "ColorPaletteSelect",
  options: ["blue", "red", "green", "orange", "yellow", "grey"],
};

const colorPaletteToneToggle: CheckboxField = {
  name: "colorPaletteDarker",
  type: "checkbox",
  admin: {
    description: "Use a slightly darker nuance of the color palette",
  },
};

const TextCard: Block = {
  slug: "TextCard",
  interfaceName: "TextCardBlock",
  imageURL: "/payload/text_card.png",
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
    },
    {
      name: "body",
      type: "richText",
      required: true,
    },
    markdownConvertedField("body"),
    {
      name: "variant",
      type: "select",
      options: ["info", "hero"],
      defaultValue: "info",
      required: true,
    },
    {
      name: "separatorAfterHeading",
      type: "checkbox",
      required: true,
      defaultValue: false,
    },
    {
      name: "buttonText",
      type: "text",
      required: false,
    },
    {
      name: "buttonLink",
      type: "text",
      required: false,
    },
    {
      name: "headerImage",
      type: "upload",
      relationTo: "media",
    },
    colorPaletteSelect,
  ],
};

const ImageBanner: Block = {
  slug: "ImageBanner",
  interfaceName: "ImageBannerBlock",
  imageURL: "/payload/image_banner.png",
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
    },
    {
      name: "body",
      type: "richText",
      required: true,
    },
    markdownConvertedField("body"),
    {
      name: "mainImage",
      type: "upload",
      relationTo: "media",
      required: true,
    },
    colorPaletteSelect,
    colorPaletteToneToggle,
    {
      ...colorPaletteSelect,
      name: "headingColor",
      required: false,
      admin: {
        description:
          "Color for the heading. Will follow the overall color palette by default, only use this field if you want to purposely override (for example, to achieve a more striking contrast that garners attention)",
      },
    },
    {
      name: "bgImage",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "bgSize",
      type: "number",
      min: 10,
      max: 100,
      defaultValue: 100,
      required: true,
      admin: {
        description: "The size of the background image in percent (%)",
      },
    },
    {
      name: "bgPos",
      type: "select",
      options: ["right", "left"],
      defaultValue: "right",
      required: true,
    },
  ],
};

const ImageOnlyCard: Block = {
  slug: "ImageOnlyCard",
  interfaceName: "ImageOnlyCardBlock",
  imageURL: "/payload/image_only_card.png",
  fields: [
    {
      name: "mainImage",
      type: "upload",
      relationTo: "media",
      required: true,
    },
    {
      name: "heading",
      type: "text",
    },
    colorPaletteSelect,
  ],
};

const FeaturedCompetitions: Block = {
  slug: "FeaturedComps", // intentionally short to avoid Payload internally assigning a long table name
  interfaceName: "FeaturedCompetitionsBlock",
  imageURL: "/payload/featured_upcoming_competitions.png",
  fields: [
    {
      name: "competitions",
      type: "array",
      fields: [
        {
          name: "competitionId",
          type: "text",
          required: true,
        },
        colorPaletteSelect,
      ],
    },
  ],
};

const AnnouncementsSection: Block = {
  slug: "AnnouncementsSection",
  interfaceName: "AnnouncementsSectionBlock",
  imageURL: "/payload/announcement_section.png",
  fields: [
    {
      name: "mainAnnouncement",
      type: "relationship",
      relationTo: "announcements",
      required: true,
    },
    {
      name: "furtherAnnouncements",
      type: "relationship",
      relationTo: "announcements",
      hasMany: true,
    },
    colorPaletteSelect,
  ],
};

const TestimonialsSpinner: Block = {
  slug: "TestimonialsSpinner",
  interfaceName: "TestimonialsBlock",
  imageURL: "/payload/testimonials_spinner.png",
  labels: {
    singular: "Testimonials Section",
    plural: "Testimonials Sections",
  },
  fields: [
    {
      name: "slides",
      type: "array",
      fields: [
        {
          name: "testimonial",
          type: "relationship",
          relationTo: "testimonials",
          required: true,
        },
        colorPaletteSelect,
      ],
      required: true,
      minRows: 1,
    },
  ],
};

const coreBlocks = [
  TextCard,
  AnnouncementsSection,
  ImageBanner,
  ImageOnlyCard,
  TestimonialsSpinner,
  FeaturedCompetitions,
];

const twoBlocksLeaf: Block = {
  slug: "twoBlocksLeaf",
  interfaceName: "TwoBlocksLeafBlock",
  fields: [
    {
      name: "type",
      type: "select",
      required: true,
      options: [
        "1/3 & 2/3",
        "2/3 & 1/3",
        "1/2 & 1/2",
        "1/4 & 3/4",
        "3/4 & 1/4",
      ],
    },
    {
      name: "alignment",
      type: "select",
      required: true,
      options: ["horizontal", "vertical"],
    },
    {
      name: "blocks",
      type: "blocks",
      blocks: coreBlocks,
      required: true,
      minRows: 2,
      maxRows: 2,
    },
  ],
};

const twoBlocksBranch: Block = {
  slug: "twoBlocksBranch",
  interfaceName: "TwoBlocksBranchBlock",
  fields: [
    {
      name: "type",
      type: "select",
      required: true,
      options: [
        "1/3 & 2/3",
        "2/3 & 1/3",
        "1/2 & 1/2",
        "1/4 & 3/4",
        "3/4 & 1/4",
      ],
    },
    {
      name: "alignment",
      type: "select",
      required: true,
      options: ["horizontal", "vertical"],
    },
    {
      name: "blocks",
      type: "blocks",
      blocks: [...coreBlocks, twoBlocksLeaf],
      required: true,
      minRows: 2,
      maxRows: 2,
    },
  ],
};

const twoBlocks: Block = {
  slug: "twoBlocks",
  interfaceName: "TwoBlocksBlock",
  fields: [
    {
      name: "type",
      type: "select",
      required: true,
      options: [
        "1/3 & 2/3",
        "2/3 & 1/3",
        "1/2 & 1/2",
        "1/4 & 3/4",
        "3/4 & 1/4",
      ],
    },
    {
      name: "alignment",
      type: "select",
      required: true,
      options: ["horizontal", "vertical"],
    },
    {
      name: "blocks",
      type: "blocks",
      blocks: [...coreBlocks, twoBlocksBranch],
      required: true,
      minRows: 2,
      maxRows: 2,
    },
  ],
};

const fullWidth: Block = {
  slug: "fullWidth",
  interfaceName: "FullWidthBlock",
  fields: [
    {
      name: "blocks",
      type: "blocks",
      blocks: coreBlocks,
      required: true,
      maxRows: 1,
    },
  ],
};

export const Home: GlobalConfig = {
  slug: "home",
  fields: [
    {
      name: "item",
      type: "blocks",
      blocks: [twoBlocks, fullWidth],
      required: true,
      minRows: 1,
    },
  ],
  admin: {
    livePreview: {
      url: "/",
    },
  },
};
