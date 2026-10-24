import { ChakraMarkdown } from "@/components/Markdown";

/// Lists need `textStyle` and `paddingInlineStart` because `List.Root` inherits the root font
/// size rather than the `body` one the `text` recipe gives paragraphs, and Chakra's reset drops
/// the browser's list indentation without putting anything back.
export default function IncidentMarkdown({ children }: { children: string }) {
  return (
    <ChakraMarkdown listProps={{ textStyle: "body", paddingInlineStart: "6" }}>
      {children}
    </ChakraMarkdown>
  );
}
