import { Block, GlobalConfig } from "payload";

import { iconMap, IconName } from "@/components/icons/iconMap";

const iconOptions = Object.keys(iconMap) as IconName[];

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
      type: "text",
      required: true,
    },
    {
      name: "displayIcon",
      type: "select",
      options: iconOptions,
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
