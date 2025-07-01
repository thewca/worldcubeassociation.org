import { Prose } from "@/components/ui/prose";
import Markdown from "react-markdown";
import { Link as ChakraLink } from "@chakra-ui/react";

interface MarkdownProseProps {
  content: string;
}

export const MarkdownProse = ({ content }: MarkdownProseProps) => {
  return (
    <Prose>
      <Markdown
        components={{
          a: ({ href, children }) => (
            <ChakraLink
              href={href || "#"}
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </ChakraLink>
          ),
        }}
      >
        {content}
      </Markdown>
    </Prose>
  );
};
