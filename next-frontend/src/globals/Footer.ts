import type { Block, GlobalConfig } from "payload";
import type { Route } from "nextjs-routes";

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

export const Footer: GlobalConfig = {
  slug: "footer",
  fields: [
    {
      name: "navigationLinks",
      type: "blocks",
      blocks: [FooterLinkItem, FooterExternalLinkItem],
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
