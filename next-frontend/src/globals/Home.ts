import { Block, GlobalConfig, SelectField } from "payload";

const colorSelect: SelectField = {
  name: "color",
  type: "select",
  required: true,
  interfaceName: "ColorSelect",
  options: [
    "darkBlue",
    "darkRed",
    "darkGreen",
    "darkOrange",
    "darkYellow",
    "blue",
    "red",
    "green",
    "orange",
    "yellow",
    "white",
    "black",
  ],
};

const colorPaletteSelect: SelectField = {
  name: "colorPalette",
  type: "select",
  required: true,
  interfaceName: "ColorPaletteSelect",
  options: ["blue", "red", "green", "orange", "yellow", "grey"],
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
      type: "textarea",
      required: true,
    },
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
      type: "textarea",
      required: true,
    },
    {
      name: "mainImage",
      type: "upload",
      relationTo: "media",
      required: true,
    },
    colorPaletteSelect,
    {
      ...colorSelect,
      name: "bgColor",
    },
    {
      ...colorSelect,
      name: "headingColor",
    },
    {
      ...colorSelect,
      name: "textColor",
    },
    {
      name: "bgImage",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "bgSize",
      type: "number",
      defaultValue: 100,
    },
    {
      name: "bgPos",
      type: "text",
      defaultValue: "right",
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
  slug: "FeaturedCompetitions",
  interfaceName: "FeaturedCompetitionsBlock",
  imageURL: "/payload/featured_upcoming_competitions.png",
  fields: [
    {
      name: "Competition1ID",
      type: "text",
      required: true,
    },
    {
      ...colorPaletteSelect,
      name: "colorPalette1",
    },
    {
      name: "Competition2ID",
      type: "text",
      required: true,
    },
    {
      ...colorPaletteSelect,
      name: "colorPalette2",
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

const TestimonialSlide: Block = {
  slug: "TestimonialSlide",
  interfaceName: "TestimonialSlideBlock",
  labels: {
    singular: "Testimonial",
    plural: "Testimonials",
  },
  fields: [
    {
      name: "testimonial",
      type: "relationship",
      relationTo: "testimonials",
      required: true,
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
      name: "blocks",
      type: "blocks",
      blocks: [TestimonialSlide],
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
