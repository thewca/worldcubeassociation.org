import { Block, GlobalConfig } from "payload";

import { iconMap, type IconName } from "@/components/icons/iconMap";
import type { Route, StaticRoute } from "nextjs-routes";

const iconOptions = Object.keys(iconMap) as IconName[];

type ExtractStaticPaths<T> = T extends StaticRoute<infer P> ? P : never;
type StaticPaths = ExtractStaticPaths<Route>;

const staticLinkOptions = [
  "/",
  "/faq",
  "/api/swagger",
  "/competitions",
] satisfies StaticPaths[];

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
      blocks: [LinkItem],
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
      blocks: [LinkItem, NestedDropdown, VisualDivider],
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
      blocks: [Dropdown, LinkItem],
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
