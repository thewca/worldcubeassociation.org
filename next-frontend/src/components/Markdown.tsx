import { Prose } from "@/components/ui/prose";
import Markdown from "react-markdown";
import { Text } from "@chakra-ui/react";
import { Link as ChakraLink } from "@chakra-ui/react";
import Link from "next/link";

import type { ElementType } from "react";

interface MarkdownProseProps {
  content: string;
  as?: ElementType;
}

export const MarkdownProse = ({
  content,
  as: RenderAs = Prose,
}: MarkdownProseProps) => {
  return (
    <RenderAs>
      <Markdown
        components={{
          a: ({ href, children }) => (
            <ChakraLink asChild>
              <Link
                href={href || "#"}
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </Link>
            </ChakraLink>
          ),
        }}
      >
        {content}
      </Markdown>
    </RenderAs>
  );
};

export const MarkdownText = ({ content }: MarkdownProseProps) => {
  return (
    <Text>
      <Markdown
        components={{
          a: ({ href, children }) => (
            <ChakraLink asChild>
              <Link
                href={href || "#"}
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </Link>
            </ChakraLink>
          ),
        }}
      >
        {content}
      </Markdown>
    </Text>
  );
};
