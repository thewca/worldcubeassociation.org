import { ChakraMarkdown } from "@/components/Markdown";

/// Incidents are the only place we render long-form prose, so they need block spacing that
/// `ChakraMarkdown`'s other callers — a sentence or two inside a card — would not want.
/// Lists additionally need `textStyle` and `paddingInlineStart` because `List.Root` inherits
/// the root font size rather than the `body` one the `text` recipe gives paragraphs, and
/// Chakra's reset drops the browser's list indentation without putting anything back.
///
/// The bottom margin is unconditional: `_last` compiles to `:last-of-type`, which would strip
/// it from the final paragraph of a summary that ends in a list — exactly the gap we want.
export default function IncidentMarkdown({ children }: { children: string }) {
  return (
    <ChakraMarkdown
      mb="4"
      listProps={{ textStyle: "body", paddingInlineStart: "6", mb: "4" }}
    >
      {children}
    </ChakraMarkdown>
  );
}
