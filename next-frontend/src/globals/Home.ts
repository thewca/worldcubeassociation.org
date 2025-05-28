import { Block, GlobalConfig } from "payload";

const colorPalettes = ["blue", "red", "green", "orange", "yellow", "grey"];

const BasicCard: Block = {
  slug: "BasicCard",
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
      name: "colorPalette",
      type: "select",
      options: colorPalettes,
    },
  ],
};

const ImageBanner: Block = {
  slug: "ImageBanner",
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
    },
    {
      name: "colorPalette",
      type: "select",
      options: colorPalettes,
    },
    {
      name: "headingColor",
      type: "select",
      options: colorPalettes,
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
    },
    {
      name: "colorPalette",
      type: "select",
      options: colorPalettes,
    },
  ],
};

const HeroCard: Block = {
  slug: "HeroCard",
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
      name: "colorPalette",
      type: "select",
      options: colorPalettes,
    },
  ],
};

const CardWithImage: Block = {
    slug: "CardWithImage",
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
    },
  ],
}

const FeaturedCompetitions: Block = {
    slug: "FeaturedCompetitions",
    fields: [
    {
      name: "Competition1ID",
      type: "text",
      required: true,
    },
    {
      name: "colorPalette1",
      type: "select",
      options: colorPalettes,
    },
    {
      name: "Competition2ID",
      type: "text",
      required: true,
    },
    {
      name: "colorPalette2",
      type: "select",
      options: colorPalettes,
    },
  ],
}

const AnnouncementsSection: Block = {
  slug: "AnnouncementsSection",
  fields: [],
};

const TestimonialSlide: Block = {
  slug: "testimonial", // singular
  labels: {
    singular: "Testimonial",
    plural: "Testimonials",
  },
  fields: [
    {
      name: "id",
      type: "text",
      required: true,
    },
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
    {
      name: "colorPalette",
      type: "select",
      options: colorPalettes,
      required: true,
    },
  ],
};

const Testimonials: Block = {
  slug: "testimonials",
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
