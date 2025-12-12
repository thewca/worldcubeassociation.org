import { Block, GlobalConfig } from "payload";
import { colorPaletteSelect } from "@/blocks/utils";
import { TextCardBlock } from "@/blocks/text/textCard";
import { BannerImageBlock } from "@/blocks/image/bannerImage";
import { ImageCardBlock } from "@/blocks/image/imageCard";

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
  TextCardBlock,
  AnnouncementsSection,
  BannerImageBlock,
  ImageCardBlock,
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
  versions: {
    drafts: {
      autosave: true,
    },
    max: 5,
  },
  admin: {
    livePreview: {
      url: "/",
    },
    preview: () => {
      const encodedParams = new URLSearchParams({
        path: "/",
        previewSecret: process.env.PREVIEW_SECRET!,
      });

      return `/api/payload/draft?${encodedParams.toString()}`;
    },
  },
};
