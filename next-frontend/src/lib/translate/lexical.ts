/**
 * Mapping Lexical rich text to and from flat translation units.
 *
 * Rather than shipping Lexical JSON to translators (which is what forced the
 * prototype to hand-roll an editor), each *block* (paragraph, heading, list
 * item, ...) becomes its own unit, keyed by its index path in the tree:
 *
 *   home:body            -> plain field
 *   home:body#0          -> the paragraph at root.children[0]
 *
 * Inline nodes inside a block become numbered placeholders, so a translator
 * sees a whole sentence and can move a link or a bold run to wherever the
 * target language needs it:
 *
 *   See <1>our website</1> or <2>this</2>.<3/>
 *
 * `<n>…</n>` wraps a formatted text run or an inline element such as a link,
 * `<n/>` stands for a node without text (a line break). Plain text is written
 * as is.
 *
 * On write-back we copy the **source** state and rebuild only the children of
 * translated blocks, from the source's own inline nodes, so structure, node
 * `version`s and any node type we have never heard of come from Payload itself.
 *
 * Payload's own `convertLexicalToPlaintext` is not a substitute: it flattens an
 * editor state to one string, which is lossy and cannot be written back.
 */
import _ from "lodash";
import { isRecord } from "./registry";

type LexicalNode = Record<string, unknown>;

// Lexical's inline element types. An unknown inline type is treated as a block
// of its own, which splits its sentence but never corrupts a write.
const INLINE_ELEMENTS = new Set(["link", "autolink"]);

const PLACEHOLDER = /<(\d+)\/>|<(\d+)>|<\/(\d+)>/g;

const DEFAULT_TEXT: LexicalNode = {
  type: "text",
  version: 1,
  detail: 0,
  format: 0,
  mode: "normal",
  style: "",
  text: "",
};

function lexicalRoot(value: unknown): LexicalNode | null {
  return isRecord(value) && isRecord(value.root) ? value.root : null;
}

function childrenOf(node: LexicalNode): unknown[] {
  return Array.isArray(node.children) ? node.children : [];
}

type TextNode = LexicalNode & { text: string };

const isText = (node: unknown): node is TextNode =>
  isRecord(node) && node.type === "text" && typeof node.text === "string";

const isPlainText = (node: unknown): node is TextNode =>
  isText(node) && !node.format && !node.style;

const isInlineElement = (node: unknown) =>
  isRecord(node) &&
  typeof node.type === "string" &&
  INLINE_ELEMENTS.has(node.type);

const isBlock = (node: LexicalNode) =>
  childrenOf(node).some((child) => isText(child) || isInlineElement(child));

/**
 * The nodes of a block, depth-first, descending into inline elements. The
 * non-plain ones are the placeholders: `<n>` stands for the n-th of them.
 */
const inlineNodes = (nodes: unknown[]): LexicalNode[] =>
  nodes
    .filter(isRecord)
    .flatMap((node) =>
      isInlineElement(node) ? [node, ...inlineNodes(childrenOf(node))] : [node],
    );

function placeholdersOf(block: LexicalNode) {
  const nodes = inlineNodes(childrenOf(block));
  return {
    placeholders: nodes.filter((node) => !isPlainText(node)),
    // Plain text a translator writes is cloned from the block's own plain text,
    // so it keeps whatever `mode`/`detail` Payload gave it.
    plain: nodes.find(isPlainText) ?? DEFAULT_TEXT,
  };
}

function serializeBlock(block: LexicalNode): string {
  const { placeholders } = placeholdersOf(block);

  const serialize = (nodes: unknown[]): string =>
    nodes
      .filter(isRecord)
      .map((node) => {
        if (isPlainText(node)) return node.text;
        const id = placeholders.indexOf(node);
        if (isText(node)) return `<${id}>${node.text}</${id}>`;
        if (isInlineElement(node))
          return `<${id}>${serialize(childrenOf(node))}</${id}>`;
        return `<${id}/>`;
      })
      .join("");

  return serialize(childrenOf(block));
}

// `split` with PLACEHOLDER's three capture groups yields one text fragment, then
// one slot per group: [text, void, open, close, text, ...].
const SPLIT_STRIDE = 4;

interface Frame {
  id?: number;
  children: unknown[];
}

/**
 * Inverse of `serializeBlock`, or `undefined` when the translation does not
 * use every placeholder exactly once with the right shape.
 */
function parseBlock(
  translation: string,
  block: LexicalNode,
): unknown[] | undefined {
  const { placeholders, plain } = placeholdersOf(block);
  const tokens = _.chunk(translation.split(PLACEHOLDER), SPLIT_STRIDE);

  const ids = tokens.flatMap(([, selfClosing, open]) =>
    [selfClosing, open].filter((id) => id !== undefined).map(Number),
  );
  if (ids.length !== placeholders.length || new Set(ids).size !== ids.length)
    return undefined;

  const append = (stack: Frame[], child: unknown): Frame[] => {
    const top = stack[stack.length - 1];
    return [
      ...stack.slice(0, -1),
      { ...top, children: [...top.children, child] },
    ];
  };

  const close = (stack: Frame[], id: number): Frame[] | undefined => {
    const top = stack[stack.length - 1];
    const node = placeholders[id];
    if (stack.length < 2 || top.id !== id) return undefined;
    const rest = stack.slice(0, -1);
    if (isInlineElement(node))
      return append(rest, { ...node, children: top.children });
    if (isText(node) && top.children.every(isPlainText))
      return append(rest, {
        ...node,
        text: top.children.map((child) => child.text).join(""),
      });
    return undefined;
  };

  const step = (
    stack: Frame[] | undefined,
    [text, selfClosing, open, closing]: (string | undefined)[],
  ): Frame[] | undefined => {
    if (!stack) return undefined;
    const withText = text ? append(stack, { ...plain, text }) : stack;
    if (selfClosing !== undefined) {
      const node = placeholders[Number(selfClosing)];
      return node && !isText(node) && !isInlineElement(node)
        ? append(withText, node)
        : undefined;
    }
    if (open !== undefined)
      return placeholders[Number(open)]
        ? [...withText, { id: Number(open), children: [] }]
        : undefined;
    if (closing !== undefined) return close(withText, Number(closing));
    return withText;
  };

  const stack = tokens.reduce(step, [{ children: [] }]);
  return stack?.length === 1 ? stack[0].children : undefined;
}

/** Index paths and nodes of every block, outermost first. */
function lexicalBlocks(value: unknown): { path: string; node: LexicalNode }[] {
  const visit = (
    node: unknown,
    path: number[],
  ): { path: string; node: LexicalNode }[] => {
    if (!isRecord(node)) return [];
    if (isBlock(node)) return [{ path: path.join("."), node }];
    return childrenOf(node).flatMap((child, i) => visit(child, [...path, i]));
  };

  const root = lexicalRoot(value);
  return root ? childrenOf(root).flatMap((child, i) => visit(child, [i])) : [];
}

/**
 * Every non-blank block in a Lexical value, with its index path, its text in
 * placeholder form, and a `shape` that is equal for two blocks exactly when
 * they differ only in their text.
 */
export function lexicalUnits(
  value: unknown,
): { path: string; text: string; shape: string }[] {
  return lexicalBlocks(value).flatMap(({ path, node }) => {
    const text = serializeBlock(node);
    if (!text.replace(PLACEHOLDER, "").trim()) return [];
    const shape = JSON.stringify(node, (key, v) =>
      key === "text" ? undefined : v,
    );
    return [{ path, text, shape }];
  });
}

/**
 * Copy `source`, replacing the content of every block named in `texts`.
 * Returns `undefined` if any translation has broken placeholders.
 */
export function applyLexicalTexts(
  source: unknown,
  texts: Map<string, string>,
): unknown {
  const rebuild = (node: unknown, path: number[]): unknown => {
    if (!isRecord(node)) return node;
    const translation = texts.get(path.join("."));
    if (translation !== undefined && isBlock(node)) {
      const children = parseBlock(translation, node);
      return children && { ...node, children };
    }
    if (!Array.isArray(node.children)) return { ...node };
    const children = node.children.map((child, i) =>
      rebuild(child, [...path, i]),
    );
    // A broken block anywhere below makes the whole value untranslated.
    return children.includes(undefined) ? undefined : { ...node, children };
  };

  if (!isRecord(source) || !isRecord(source.root)) return source;
  const root = rebuild(source.root, []);
  return root && { ...source, root };
}
