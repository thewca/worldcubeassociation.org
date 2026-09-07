import { Card } from "@chakra-ui/react";
import type { Options } from "react-markdown";
import { ChakraMarkdown } from "@/components/Markdown";

export default function MarkdownCard({
  title,
  children,
}: {
  title?: string | null;
  children: Options["children"];
}) {
  return (
    <Card.Root>
      <Card.Body>
        {title && <Card.Title>{title}</Card.Title>}
        <ChakraMarkdown paragraphAs={Card.Description}>
          {children}
        </ChakraMarkdown>
      </Card.Body>
    </Card.Root>
  );
}
