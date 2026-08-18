import Markdown, { Options } from "react-markdown";
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

import type {
  ComponentProps,
  ComponentPropsWithoutRef,
  ComponentType,
  ElementType,
} from "react";
import type {
  Heading as MdastHeading,
  Paragraph as MdastParagraph,
  Root as MdastRoot,
} from "mdast";

const HEADING_DEPTHS = {
  "#": 1,
  "##": 2,
  "###": 3,
  "####": 4,
  "#####": 5,
  "######": 6,
} as const;

const LOOSE_HEADING_PREFIX = /^(#{1,6})(?=[^#\s])/;

const isHeadingPrefix = (
  prefix: string,
): prefix is keyof typeof HEADING_DEPTHS => prefix in HEADING_DEPTHS;

const asLooseHeading = (
  paragraph: MdastParagraph,
): MdastHeading | undefined => {
  // A heading is always a single line. Promoting a multi-line paragraph would swallow the
  //   lines that follow the hashes into the heading.
  if (paragraph.position?.start.line !== paragraph.position?.end.line) {
    return undefined;
  }

  const [firstChild, ...siblings] = paragraph.children;

  if (firstChild?.type !== "text") {
    return undefined;
  }

  const prefix = LOOSE_HEADING_PREFIX.exec(firstChild.value)?.[1];

  if (prefix === undefined || !isHeadingPrefix(prefix)) {
    return undefined;
  }

  return {
    type: "heading",
    depth: HEADING_DEPTHS[prefix],
    children: [
      { ...firstChild, value: firstChild.value.slice(prefix.length) },
      ...siblings,
    ],
  };
};

// The rest of the WCA website renders markdown with Redcarpet, which accepts `##Heading`
//   even though CommonMark demands a space after the hashes. Authors write against Redcarpet,
//   so what they wrote has to keep working here. Only top-level paragraphs are promoted; a
//   space-less heading nested in a list or quote stays a paragraph.
// Transformers are handed the tree to edit in place; that is the remark plugin contract.
const remarkLooseHeadings = () => (tree: MdastRoot) => {
  tree.children = tree.children.map((child) =>
    child.type === "paragraph" ? (asLooseHeading(child) ?? child) : child,
  );
};

type DefaultParagraph = typeof Text;
type ParagraphElement = ElementType<ComponentProps<"p">>;

type MarkdownBaseProps = {
  children: Options["children"];
  linkProps?: ComponentPropsWithoutRef<typeof ChakraLink>;
  imageProps?: ComponentPropsWithoutRef<typeof ChakraImage>;
  listProps?: ComponentPropsWithoutRef<typeof List.Root>;
  headingAs?: ComponentType<{ as?: ElementType }>;
};

type MarkdownDynamicProps<T extends ElementType> = MarkdownBaseProps & {
  paragraphAs?: T;
} & Omit<ComponentPropsWithoutRef<T>, keyof MarkdownBaseProps | "paragraphAs">;

export type ChakraMarkdownComponent = <
  E extends ParagraphElement = ParagraphElement,
  T extends E = DefaultParagraph extends E ? DefaultParagraph : E,
>(
  props: MarkdownDynamicProps<T>,
) => ReturnType<typeof Markdown>;

export const ChakraMarkdown: ChakraMarkdownComponent = ({
  children,
  linkProps = {},
  imageProps = {},
  listProps = {},
  headingAs: HeadingRenderAs = Heading,
  paragraphAs: ParagraphRenderAs = Text,
  ...paragraphProps
}) => {
  return (
    <Markdown
      remarkPlugins={[remarkLooseHeadings]}
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
        p: (pTag) => <ParagraphRenderAs {...pTag} {...paragraphProps} />,
        em: Em,
        hr: Separator,
        code: Code,
        // Chakra's reset drops the browser's default list padding and its list recipe does not
        //   put any back, so without this the markers have nowhere to sit and the list reads
        //   as flush body text.
        ul: (ulTag) => <List.Root {...ulTag} ps="6" {...listProps} as="ul" />,
        ol: (olTag) => <List.Root {...olTag} ps="6" {...listProps} as="ol" />,
        li: List.Item,
        blockquote: (blockquoteTag) => (
          <Blockquote.Root>
            <Blockquote.Content {...blockquoteTag} />
          </Blockquote.Root>
        ),
      }}
    >
      {children}
    </Markdown>
  );
};
