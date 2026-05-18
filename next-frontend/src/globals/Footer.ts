import type { Block, GlobalConfig } from "payload";
import { iconMap, type IconName } from "@/components/icons/iconMap";
import type { Route } from "nextjs-routes";

const iconOptions = Object.keys(iconMap) as IconName[];

type StaticRoute = Exclude<Route, { query: unknown }>["pathname"];

const staticLinkOptions = [
  "/",
  "/about",
  "/competitions",
  "/delegates",
  "/disclaimer",
  "/documents",
  "/export/developer",
  "/export/results",
  "/faq",
  "/incidents",
  "/logo",
  "/officers-and-board",
  "/organizations",
  "/privacy",
  "/regulations/about",
  "/regulations/history",
  "/regulations/scrambles",
  "/regulations/translations",
  "/results/rankings",
  "/results/records",
  "/score-tools",
  "/speedcubing-history",
  "/teams-committees",
  "/translators",
] satisfies StaticRoute[];

const FooterLinkItem: Block = {
  slug: "FooterLinkItem",
  fields: [
    {
      name: "displayText",
      type: "text",
      required: true,
    },
    {
      name: "targetLink",
      type: "select",
      options: staticLinkOptions,
      interfaceName: "StaticTargetLink",
      required: true,
    },
  ],
};

const FooterExternalLinkItem: Block = {
  slug: "FooterExternalLinkItem",
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
  ],
};

const FooterSocialLinkItem: Block = {
  slug: "FooterSocialLinkItem",
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

export const Footer: GlobalConfig = {
  slug: "footer",
  fields: [
    {
      name: "navigationLinks",
      type: "blocks",
      blocks: [FooterLinkItem, FooterExternalLinkItem],
    },
    {
      name: "socialLinks",
      type: "blocks",
      blocks: [FooterSocialLinkItem],
    },
    {
      name: "legalLinks",
      type: "blocks",
      blocks: [FooterLinkItem],
    },
  ],
  admin: {
    livePreview: {
      url: "/",
    },
  },
};