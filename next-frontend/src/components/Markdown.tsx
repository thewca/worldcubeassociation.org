import Markdown, { Options } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import {
  chakra,
  Link as ChakraLink,
  Image as ChakraImage,
  Em,
  Separator,
  Code,
  List,
  Blockquote,
  Text,
  Heading,
  Table,
} from "@chakra-ui/react";

import type {
  ComponentProps,
  ComponentPropsWithoutRef,
  ComponentType,
  ElementType,
} from "react";
import type { Parent as MdastParent, Root as MdastRoot } from "mdast";

const LOOSE_HEADING_PREFIX = /^(#{1,6})(?=[^#\s])/gm;

// The rest of the WCA website renders markdown with Redcarpet, which accepts `##Heading`
//   even though CommonMark demands a space after the hashes. Authors write against Redcarpet,
//   so what they wrote has to keep working here. Redcarpet also ends a paragraph on such a
//   line, so the space is added on the raw text: CommonMark lets a proper heading interrupt a
//   paragraph, which a space-less one glued to the next line would never get the chance to.
const spaceLooseHeadings = (markdown: Options["children"]) =>
  markdown?.replace(LOOSE_HEADING_PREFIX, "$1 ");

const YOUTUBE_OPENING = "youtube(";

const youtubeEmbedUrl = (href: string) => {
  const url = URL.parse(href);

  const isYoutube =
    url?.hostname === "youtube.com" || url?.hostname.endsWith(".youtube.com");

  const videoId = isYoutube ? url?.searchParams.get("v") : null;

  return videoId ? `https://www.youtube.com/embed/${videoId}` : undefined;
};

const embedYoutubeLinks = (parent: MdastParent) => {
  parent.children.forEach((child, index) => {
    const before = parent.children[index - 1];
    const after = parent.children[index + 1];

    if (
      child.type === "link" &&
      before?.type === "text" &&
      before.value.endsWith(YOUTUBE_OPENING) &&
      after?.type === "text" &&
      after.value.startsWith(")")
    ) {
      const embedUrl = youtubeEmbedUrl(child.url);

      if (embedUrl) {
        before.value = before.value.slice(0, -YOUTUBE_OPENING.length);
        after.value = after.value.slice(1);
        child.data = {
          hName: "iframe",
          hProperties: {
            src: embedUrl,
            href: undefined,
            title: "YouTube video",
            allowFullScreen: true,
            maxW: "640px",
            aspectRatio: "16 / 9",
          },
          hChildren: [],
        };
      }
    }

    if ("children" in child) embedYoutubeLinks(child);
  });
};

// Redcarpet (used by the rest of the WCA website) turns `youtube(https://www.youtube.com/watch?v=…)`
//   into an embedded video, so authors' existing videos have to keep showing up here. Only
//   YouTube watch links are embedded; anything else stays the literal text the author wrote.
// Transformers are handed the tree to edit in place; that is the remark plugin contract.
const remarkYoutubeEmbeds = () => (tree: MdastRoot) => embedYoutubeLinks(tree);

const TABLE_DELIMITER_ROW = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

const tableCells = (row: string) =>
  row
    .trim()
    .replace(/^\|/, "")
    .replace(/(?<!\\)\|$/, "")
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim());

const withHeaderCellCount = (delimiterRow: string, headerRow: string) => {
  const delimiterCells = tableCells(delimiterRow);

  const resized = tableCells(headerRow).map(
    (_, index) => delimiterCells[index] ?? "---",
  );

  return `| ${resized.join(" | ")} |`;
};

// GFM only recognises a table when the delimiter row has exactly as many cells as the header,
//   but Redcarpet (used by the rest of the WCA website) renders it regardless. Authors write
//   against Redcarpet, so the delimiter row is resized to the header before parsing. This has
//   to happen on the raw text because a mismatched table never makes it into the syntax tree.
const alignTableDelimiters = (markdown: Options["children"]) => {
  if (!markdown) return markdown;

  const lines = markdown.split("\n");

  return lines
    .map((line, index) => {
      const headerRow = lines[index - 1];

      return headerRow?.includes("|") &&
        line.includes("|") &&
        TABLE_DELIMITER_ROW.test(line)
        ? withHeaderCellCount(line, headerRow)
        : line;
    })
    .join("\n");
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
      remarkPlugins={[
        // Redcarpet only strikes through on `~~`, so `~5 min` must stay literal here too.
        [remarkGfm, { singleTilde: false }],
        // Redcarpet renders with `hard_wrap`, keeping every single line break the author typed.
        remarkBreaks,
        remarkYoutubeEmbeds,
      ]}
      components={{
        a: ({ children, ...aTag }) => (
          <ChakraLink
            {...aTag}
            // Chakra's link recipe is `inline-flex`, which strips whitespace at
            // the edges of the link text. Markdown authors regularly write
            // `the[ Policy](url)`, where that space is the only thing
            // separating the link from the word before it.
            display="inline"
            {...linkProps}
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </ChakraLink>
        ),
        img: (imgTag) => <ChakraImage {...imgTag} {...imageProps} />,
        iframe: (iframeTag) => (
          <chakra.iframe
            display="block"
            width="full"
            border="none"
            {...iframeTag}
          />
        ),
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
        ul: (ulTag) => <List.Root {...ulTag} indented {...listProps} as="ul" />,
        ol: (olTag) => <List.Root {...olTag} indented {...listProps} as="ol" />,
        li: List.Item,
        blockquote: (blockquoteTag) => (
          <Blockquote.Root>
            <Blockquote.Content {...blockquoteTag} />
          </Blockquote.Root>
        ),
        table: (tableProps) => (
          <Table.ScrollArea>
            <Table.Root {...tableProps} />
          </Table.ScrollArea>
        ),
        thead: Table.Header,
        tbody: Table.Body,
        tr: Table.Row,
        th: Table.ColumnHeader,
        td: Table.Cell,
      }}
    >
      {alignTableDelimiters(spaceLooseHeadings(children))}
    </Markdown>
  );
};
