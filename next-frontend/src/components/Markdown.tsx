import { Prose } from "@/components/ui/prose";
import Markdown from "react-markdown";
import { Link as ChakraLink } from "@chakra-ui/react";
import Link from "next/link";

interface MarkdownProseProps {
  content: string;
}

export const MarkdownProse = ({ content }: MarkdownProseProps) => {
  return (
    <Prose>
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
    </Prose>
  );
};
