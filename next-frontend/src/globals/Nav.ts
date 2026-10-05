import { Block, GlobalConfig } from "payload";

import { iconMap, type IconName } from "@/components/icons/iconMap";
import { revalidateGlobal } from "@/globals/revalidateGlobal";
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

const LinkItem: Block = {
  slug: "LinkItem", // required
  fields: [
    // required
    {
      name: "displayText",
      type: "text",
      required: true,
      localized: true,
      admin: {
        description: "Link text shown in the navigation.",
      },
    },
    {
      name: "targetLink",
      type: "select",
      options: staticLinkOptions,
      interfaceName: "StaticTargetLink",
      required: true,
      admin: {
        description: "Page on this website the link points to.",
      },
    },
    {
      name: "displayIcon",
      type: "select",
      options: iconOptions,
      interfaceName: "IconName",
      admin: {
        description: "Optional icon shown in front of the link text.",
      },
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
      localized: true,
      admin: {
        description: "Link text shown in the navigation.",
      },
    },
    {
      name: "targetLink",
      type: "text",
      required: true,
      admin: {
        description: "URL outside this website the link points to.",
      },
    },
    {
      name: "displayIcon",
      type: "select",
      options: iconOptions,
      interfaceName: "IconName",
      admin: {
        description: "Optional icon shown in front of the link text.",
      },
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
      localized: true,
      admin: {
        description: "Label of the submenu inside the dropdown.",
      },
    },
    {
      name: "displayIcon",
      type: "select",
      options: iconOptions,
      interfaceName: "IconName",
      admin: {
        description: "Optional icon shown in front of the label.",
      },
    },
    {
      name: "entries",
      type: "blocks",
      blocks: [LinkItem, ExternalLinkItem],
      required: true,
      maxRows: 20,
      admin: {
        description: "Links inside this submenu.",
      },
    },
  ],
};

const SocialsMenu: Block = {
  slug: "SocialsMenu",
  fields: [
    {
      name: "label",
      type: "text",
      required: true,
      localized: true,
      admin: {
        description:
          "Label of the menu listing the WCA's social media profiles.",
      },
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
      localized: true,
      admin: {
        description: "Label of the dropdown in the top level navigation.",
      },
    },
    {
      name: "displayIcon",
      type: "select",
      options: iconOptions,
      interfaceName: "IconName",
      admin: {
        description: "Optional icon shown in front of the label.",
      },
    },
    {
      name: "entries",
      type: "blocks",
      blocks: [LinkItem, ExternalLinkItem, NestedDropdown, VisualDivider],
      required: true,
      admin: {
        description: "Links and submenus inside this dropdown.",
      },
    },
  ],
};

export const Nav: GlobalConfig = {
  slug: "nav",
  fields: [
    {
      name: "entry",
      type: "blocks",
      blocks: [Dropdown, LinkItem, ExternalLinkItem, SocialsMenu],
      required: true,
      maxRows: 8,
      admin: {
        description: "The top level entries of the navigation, left to right.",
      },
    },
  ],
  admin: {
    livePreview: {
      url: "/",
    },
  },
  hooks: {
    afterChange: [revalidateGlobal],
  },
};
