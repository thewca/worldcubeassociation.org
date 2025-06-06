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

const BasicCard: Block = {
  slug: "BasicCard",
  interfaceName: "BasicCardBlock",
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
    },
    {
      name: "body",
      type: "text",
      required: true,
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
    colorPaletteSelect,
  ],
};

const ImageBanner: Block = {
  slug: "ImageBanner",
  interfaceName: "ImageBannerBlock",
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
    },
    {
      name: "body",
      type: "text",
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

const ImageCard: Block = {
  slug: "ImageCard",
  interfaceName: "ImageCardBlock",
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
    },
    {
      name: "mainImage",
      type: "upload",
      relationTo: "media",
      required: true,
    },
    colorPaletteSelect,
  ],
};

const HeroCard: Block = {
  slug: "HeroCard",
  interfaceName: "HeroCardBlock",
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
    },
    {
      name: "body",
      type: "text",
      required: true,
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
    colorPaletteSelect,
  ],
};

const CardWithImage: Block = {
  slug: "CardWithImage",
  interfaceName: "CardWithImageBlock",
  fields: [
    {
      name: "heading",
      type: "text",
      required: true,
    },
    {
      name: "body",
      type: "text",
      required: true,
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
      name: "image",
      type: "upload",
      relationTo: "media",
      required: true,
    },
  ],
};

const FeaturedCompetitions: Block = {
  slug: "FeaturedCompetitions",
  interfaceName: "FeaturedCompetitionsBlock",
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
  fields: [],
};

const TestimonialSlide: Block = {
  slug: "testimonial", // singular
  interfaceName: "TestimonialSlideBlock",
  labels: {
    singular: "Testimonial",
    plural: "Testimonials",
  },
  fields: [
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      required: true,
    },
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "description",
      type: "textarea",
      required: true,
    },
    {
      name: "subtitle",
      type: "text",
    },
    colorPaletteSelect,
  ],
};

const Testimonials: Block = {
  slug: "testimonials",
  interfaceName: "TestimonialsBlock",
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
  BasicCard,
  HeroCard,
  AnnouncementsSection,
  ImageBanner,
  ImageCard,
  Testimonials,
  CardWithImage,
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
};
