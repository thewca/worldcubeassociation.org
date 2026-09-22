import { GlobalConfig } from "payload";
import { ParagraphBlock } from "@/blocks/text/paragraph";
import { QuoteBlock } from "@/blocks/text/quote";
import { CaptionedImageBlock } from "@/blocks/image/captionedImage";
import { revalidateGlobal } from "@/globals/revalidateGlobal";

export const SpeedCubingHistoryPage: GlobalConfig = {
  slug: "speedcubing-history-page",
  label: "Speedcubing History Page",
  fields: [
    {
      name: "blocks",
      type: "blocks",
      required: true,
      blocks: [ParagraphBlock, CaptionedImageBlock, QuoteBlock],
      admin: {
        description:
          "The sections making up the Speedcubing History page, top to bottom.",
      },
    },
  ],
  hooks: {
    afterChange: [revalidateGlobal],
  },
};
