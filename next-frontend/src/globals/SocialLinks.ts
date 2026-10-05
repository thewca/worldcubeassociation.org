import type { Block, GlobalConfig } from "payload";
import { iconMap, type IconName } from "@/components/icons/iconMap";
import { revalidateGlobal } from "@/globals/revalidateGlobal";

const iconOptions = Object.keys(iconMap) as IconName[];

const SocialLinkItem: Block = {
  slug: "SocialLinkItem",
  fields: [
    {
      name: "displayText",
      type: "text",
      required: true,
      localized: true,
      admin: {
        description:
          "Name of the social network, shown next to its icon and read out by screen readers.",
      },
    },
    {
      name: "targetLink",
      type: "text",
      required: true,
      admin: {
        description: "URL of the WCA's profile on that network.",
      },
    },
    {
      name: "displayIcon",
      type: "select",
      options: iconOptions,
      required: true,
      admin: {
        description: "Icon shown for this network.",
      },
    },
  ],
};

export const SocialLinks: GlobalConfig = {
  slug: "social-links",
  fields: [
    {
      name: "links",
      type: "blocks",
      blocks: [SocialLinkItem],
      admin: {
        description:
          "The WCA's social media profiles, shown in the footer and in the navigation's socials menu.",
      },
    },
  ],
  hooks: {
    afterChange: [revalidateGlobal],
  },
};
