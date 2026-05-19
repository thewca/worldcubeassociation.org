import { Prose } from "@/components/ui/prose";
import Markdown from "react-markdown";
import {
  Link as ChakraLink,
  Image as ChakraImage,
  Em,
  Separator,
  Code,
  List,
  Blockquote,
  Text,
  Heading,
} from "@chakra-ui/react";

import type { PolymorphicComponent } from "@/lib/types/components";
import type { ComponentPropsWithoutRef, ComponentType } from "react";

type MarkdownProseOwnProps = {
  content: string;
  linkProps?: ComponentPropsWithoutRef<typeof ChakraLink>;
  imageProps?: ComponentPropsWithoutRef<typeof ChakraImage>;
  headingAs?: ComponentType;
};

export const MarkdownProse: PolymorphicComponent<
  MarkdownProseOwnProps,
  typeof Prose
> = ({
  content,
  linkProps = {},
  imageProps = {},
  headingAs: HeadingRenderAs = Heading,
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
          h1: (h1Tag) => <HeadingRenderAs {...h1Tag} as="h1" />,
          h2: (h2Tag) => <HeadingRenderAs {...h2Tag} as="h2" />,
          h3: (h3Tag) => <HeadingRenderAs {...h3Tag} as="h3" />,
          h4: (h4Tag) => <HeadingRenderAs {...h4Tag} as="h4" />,
          h5: (h5Tag) => <HeadingRenderAs {...h5Tag} as="h5" />,
          h6: (h6Tag) => <HeadingRenderAs {...h6Tag} as="h6" />,
          p: Text,
          em: Em,
          hr: Separator,
          code: Code,
          ul: (ulTag) => <List.Root {...ulTag} as="ul" />,
          ol: (olTag) => <List.Root {...olTag} as="ol" />,
          li: List.Item,
          blockquote: (blockquoteTag) => (
            <Blockquote.Root>
              <Blockquote.Content {...blockquoteTag} />
            </Blockquote.Root>
          ),
        }}
      >
        {content}
      </Markdown>
    </RenderAs>
  );
};
