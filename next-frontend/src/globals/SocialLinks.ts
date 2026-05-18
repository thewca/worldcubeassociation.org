import type { Block, GlobalConfig } from "payload";
import { iconMap, type IconName } from "@/components/icons/iconMap";

const iconOptions = Object.keys(iconMap) as IconName[];

const SocialLinkItem: Block = {
  slug: "SocialLinkItem",
  fields: [
    {
      name: "displayText",
      type: "text",
      required: true,
    },
    {
      name: "targetLink",
      type: "text",
      required: true,
    },
    {
      name: "displayIcon",
      type: "select",
      options: iconOptions,
      required: true,
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
    },
  ],
  admin: {
    livePreview: {
      url: "/",
    },
  },
};