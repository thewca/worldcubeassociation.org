import { Prose } from "@/components/ui/prose";
import Markdown from "react-markdown";
import { Link as ChakraLink } from "@chakra-ui/react";

import type {
  ComponentPropsWithoutRef,
  ElementType,
  ReactElement,
} from "react";

type MarkdownProseOwnProps = {
  content: string;
};

type PolymorphicMarkdownProseProps<T extends ElementType> =
  MarkdownProseOwnProps & {
    as?: T;
  } & Omit<ComponentPropsWithoutRef<T>, keyof MarkdownProseOwnProps | "as">;

type MarkdownProseComponent = <T extends ElementType = typeof Prose>(
  props: PolymorphicMarkdownProseProps<T>,
) => ReactElement | null;

export const MarkdownProse: MarkdownProseComponent = ({
  content,
  as: RenderAs = Prose,
  ...restProps
}) => {
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
        }}
      >
        {content}
      </Markdown>
    </RenderAs>
  );
};
