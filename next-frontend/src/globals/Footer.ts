import type { Block, GlobalConfig } from "payload";
import { revalidateGlobal } from "@/globals/revalidateGlobal";
import { marketingTeamAccess } from "@/payload.access";
import { staticLinkOptions } from "@/globals/staticLinkOptions";

const FooterLinkItem: Block = {
  slug: "FooterLinkItem",
  fields: [
    {
      name: "displayText",
      type: "text",
      required: true,
      localized: true,
      admin: {
        description: "Link text shown in the footer.",
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
  ],
};

const FooterExternalLinkItem: Block = {
  slug: "FooterExternalLinkItem",
  fields: [
    {
      name: "displayText",
      type: "text",
      required: true,
      localized: true,
      admin: {
        description: "Link text shown in the footer.",
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
  ],
};

export const Footer: GlobalConfig = {
  slug: "footer",
  access: {
    update: marketingTeamAccess,
  },
  fields: [
    {
      name: "navigationLinks",
      type: "blocks",
      blocks: [FooterLinkItem, FooterExternalLinkItem],
      admin: {
        description: "Links in the main part of the footer.",
      },
    },
    {
      name: "legalLinks",
      type: "blocks",
      blocks: [FooterLinkItem],
      admin: {
        description: "Links in the legal row at the very bottom of the footer.",
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
