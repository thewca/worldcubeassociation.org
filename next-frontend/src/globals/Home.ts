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
      admin: {
        description: "The competitions to feature, in the order they appear.",
      },
      fields: [
        {
          name: "competitionId",
          type: "text",
          required: true,
          admin: {
            description: "WCA competition ID, for example 'WC2025'.",
          },
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
      admin: {
        description: "Announcement shown large at the top of the section.",
      },
    },
    {
      name: "furtherAnnouncements",
      type: "relationship",
      relationTo: "announcements",
      hasMany: true,
      admin: {
        description: "Announcements listed under the main one.",
      },
    },
    {
      name: "showSeeAll",
      type: "checkbox",
      required: true,
      defaultValue: true,
      admin: {
        description:
          "Show a link to the full list of announcements at the bottom of the section",
      },
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
      admin: {
        description: "The testimonials the spinner rotates through.",
      },
      fields: [
        {
          name: "testimonial",
          type: "relationship",
          relationTo: "testimonials",
          required: true,
          admin: {
            description: "The testimonial shown on this slide.",
          },
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

const createTwoBlocks = (depth: number = 1): Block => {
  const allowedBlocks =
    depth === 0 ? coreBlocks : [...coreBlocks, createTwoBlocks(depth - 1)];

  return {
    slug: `twoBlocksLevel${depth}`,
    interfaceName: `TwoBlocksLevel${depth}Block`,
    labels: {
      singular: "Horizontal Splitter",
      plural: "Horizontal Splitters",
    },
    fields: [
      {
        name: "ratio",
        type: "select",
        required: true,
        defaultValue: "1/2 & 1/2",
        options: [
          "1/3 & 2/3",
          "2/3 & 1/3",
          "1/2 & 1/2",
          "1/4 & 3/4",
          "3/4 & 1/4",
        ],
        admin: {
          description:
            "How the available width is split between the left and right column.",
        },
      },
      {
        type: "row",
        fields: [
          {
            name: "left",
            type: "blocks",
            blocks: allowedBlocks,
            required: true,
            minRows: 1,
            admin: {
              description: "Boxes stacked in the left column.",
            },
          },
          {
            name: "right",
            type: "blocks",
            blocks: allowedBlocks,
            required: true,
            minRows: 1,
            admin: {
              description: "Boxes stacked in the right column.",
            },
          },
        ],
      },
      {
        type: "select",
        name: "growthStrategy",
        interfaceName: "GrowthStrategy",
        options: [
          {
            label: "Grow the height of the bento boxes to fill space",
            value: "grow",
          },
          {
            label:
              "Redistribute vertical space between the bento boxes (may introduce gaps)",
            value: "justify",
          },
        ],
        admin: {
          description:
            "What to do when one column ends up shorter than the other.",
        },
      },
    ],
  };
};

export const Home: GlobalConfig = {
  slug: "home",
  fields: [
    {
      name: "layout",
      type: "blocks",
      blocks: [...coreBlocks, createTwoBlocks(2)],
      required: true,
      admin: {
        description: "The boxes making up the home page, top to bottom.",
      },
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
