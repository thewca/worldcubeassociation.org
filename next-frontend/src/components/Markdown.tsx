import { Prose } from "@/components/ui/prose";
import Markdown from "react-markdown";
import { Link as ChakraLink, Image } from "@chakra-ui/react";

import type { PolymorphicComponent } from "@/lib/types/components";

type MarkdownProseOwnProps = {
  content: string;
};

export const MarkdownProse: PolymorphicComponent<
  MarkdownProseOwnProps,
  typeof Prose
> = ({ content, as: RenderAs = Prose, ...restProps }) => {
  return (
    <RenderAs {...restProps}>
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
          img: (img) => <Image src={img.src} maxW="sm" alt={img.alt} />,
        }}
      >
        {content}
      </Markdown>
    </RenderAs>
  );
};
