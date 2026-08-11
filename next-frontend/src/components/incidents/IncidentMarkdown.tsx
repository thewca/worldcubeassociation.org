import { ChakraMarkdown } from "@/components/Markdown";

/// Incidents are the only place we render long-form prose written by WRC, so they need the
/// block spacing `ChakraMarkdown` deliberately leaves off: its other callers render a
/// sentence or two inside a card, where per-block margins would fight the card's own gap.
///
/// Lists need `textStyle` and `paddingInlineStart` spelled out because `List.Root` inherits
/// the root font size rather than the smaller `body` one the `text` recipe gives every
/// paragraph, and because Chakra's reset drops the browser's list indentation without
/// putting anything back.
///
/// The margin is unconditional rather than `_last`-guarded: `_last` compiles to
/// `:last-of-type`, so the final paragraph of a summary that ends in a list would lose the
/// margin that separates it from the bullets. A trailing margin on the last block is the
/// cheaper mistake.
export default function IncidentMarkdown({
  children,
}: {
  children?: string | null;
}) {
  return (
    <ChakraMarkdown
      mb="4"
      listProps={{ textStyle: "body", paddingInlineStart: "6", mb: "4" }}
    >
      {children}
    </ChakraMarkdown>
  );
}
