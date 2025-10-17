import { Block, GlobalConfig } from "payload";

import { iconMap, type IconName } from "@/components/icons/iconMap";
import type { Route } from "nextjs-routes";

const iconOptions = Object.keys(iconMap) as IconName[];

type StaticRoute = Exclude<Route, { query: unknown }>["pathname"];

const staticLinkOptions = [
  "/",
  "/about",
  "/competitions",
  "/competitions/mine",
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

const LinkItem: Block = {
  slug: "LinkItem", // required
  fields: [
    // required
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
    {
      name: "displayIcon",
      type: "select",
      options: iconOptions,
      interfaceName: "IconName",
    },
  ],
};

const ExternalLinkItem: Block = {
  slug: "ExternalLinkItem", // required
  fields: [
    // required
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
      interfaceName: "IconName",
    },
  ],
};

const VisualDivider: Block = {
  slug: "VisualDivider", // required
  fields: [],
};

const NestedDropdown: Block = {
  slug: "NestedDropdown",
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "displayIcon",
      type: "select",
      options: iconOptions,
      interfaceName: "IconName",
    },
    {
      name: "entries",
      type: "blocks",
      blocks: [LinkItem, ExternalLinkItem],
      required: true,
      maxRows: 20,
    },
  ],
};

const Dropdown: Block = {
  slug: "NavDropdown",
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "displayIcon",
      type: "select",
      options: iconOptions,
      interfaceName: "IconName",
    },
    {
      name: "entries",
      type: "blocks",
      blocks: [LinkItem, ExternalLinkItem, NestedDropdown, VisualDivider],
      required: true,
    },
  ],
};

export const Nav: GlobalConfig = {
  slug: "nav",
  fields: [
    {
      name: "entry",
      type: "blocks",
      blocks: [Dropdown, LinkItem, ExternalLinkItem],
      required: true,
      maxRows: 8,
    },
  ],
  admin: {
    livePreview: {
      url: "/",
    },
  },
};
