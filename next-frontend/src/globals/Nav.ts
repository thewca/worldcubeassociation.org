import { Block, GlobalConfig } from "payload";

import type { IconName } from "@/components/icons/iconMap";
import type { Route } from "nextjs-routes";

const iconOptions = [
  "About the Regulations",
  "About the WCA",
  "Admin Results",
  "All Competitions",
  "Bookmark",
  "Clone",
  "Competition Not Started",
  "Registration Closed",
  "Registration Closed (Red)",
  "Registration Full but Open",
  "Registration Full but Open (Orange)",
  "Registration Not Full, Open",
  "Registration Not Full, Open (Green)",
  "Registration Not Open Yet",
  "Registration Not Open Yet (Grey)",
  "Registration Open Date",
  "Registration Close Date",
  "Competitors",
  "Contact",
  "Delegate Report",
  "Details",
  "Developer Export",
  "Disciplinary Log",
  "Disclaimer",
  "Download",
  "Edit",
  "Educational Resources",
  "Error",
  "External Link",
  "Facebook",
  "Filters",
  "GitHub",
  "Guidelines",
  "Help and FAQs",
  "Incidents Log",
  "Information",
  "Instagram",
  "Language",
  "List",
  "Location",
  "Manage Tabs",
  "Map",
  "Media Submission",
  "Menu",
  "Multimedia",
  "My Competitions",
  "My Results",
  "National Championship",
  "New Competition",
  "On-the-Spot Registration",
  "Payment",
  "Privacy",
  "Rankings",
  "Records",
  "Regional Organisations",
  "Register",
  "Registration",
  "Regulations and Guidelines",
  "Regulations History",
  "Regulations",
  "Results Export",
  "Scrambles",
  "Search",
  "Spectators",
  "Speedcubing History",
  "Spots Left",
  "Statistics",
  "Teams, Committees and Councils",
  "Tools",
  "Translators",
  "Twitch",
  "User",
  "Users / Persons",
  "Venue",
  "WCA Delegates",
  "WCA Documents",
  "WCA Live",
  "WCA Officers and Board",
  "Weibo",
  "X (formerly Twitter)",
  "YouTube",
] satisfies IconName[];

type StaticRoute = Exclude<Route, { query: unknown }>["pathname"];

const staticLinkOptions = [
  "/",
  "/faq",
  "/api/swagger",
  "/competitions",
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
