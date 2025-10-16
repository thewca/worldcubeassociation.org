import { GlobalConfig } from "payload";
import { ParagraphBlock } from "@/blocks/text/paragraph";
import { QuoteBlock } from "@/blocks/text/quote";
import { CaptionedImageBlock } from "@/blocks/image/captionedImage";

export const SpeedCubingHistoryPage: GlobalConfig = {
  slug: "speedcubing-history-page",
  label: "Speedcubing History Page",
  fields: [
    {
      name: "blocks",
      type: "blocks",
      required: true,
      blocks: [ParagraphBlock, CaptionedImageBlock, QuoteBlock],
    },
  ],
};
