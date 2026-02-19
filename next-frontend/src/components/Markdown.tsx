import { Prose } from "@/components/ui/prose";
import Markdown from "react-markdown";
import { Link as ChakraLink, Image as ChakraImage } from "@chakra-ui/react";

import type { PolymorphicComponent } from "@/lib/types/components";
import type { ComponentPropsWithoutRef } from "react";

type MarkdownProseOwnProps = {
  content: string;
  linkProps?: ComponentPropsWithoutRef<typeof ChakraLink>;
  imageProps?: ComponentPropsWithoutRef<typeof ChakraImage>;
};

export const MarkdownProse: PolymorphicComponent<
  MarkdownProseOwnProps,
  typeof Prose
> = ({
  content,
  linkProps = {},
  imageProps = {},
  as: RenderAs = Prose,
  ...restProps
}) => {
  return (
    <RenderAs {...restProps}>
      <Markdown
        components={{
          a: ({ children, ...aTag }) => (
            <ChakraLink
              {...aTag}
              {...linkProps}
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </ChakraLink>
          ),
          img: (imgTag) => <ChakraImage {...imgTag} {...imageProps} />,
        }}
      >
        {content}
      </Markdown>
    </RenderAs>
  );
};
