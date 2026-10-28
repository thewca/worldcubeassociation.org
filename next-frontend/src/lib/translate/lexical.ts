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
import { isRecord } from "./registry";

type LexicalNode = Record<string, unknown>;

// ponytail: Lexical's inline element types; an unknown inline type is treated as
// a block of its own, which splits its sentence but never corrupts a write.
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

const isText = (node: unknown): node is LexicalNode =>
  isRecord(node) && node.type === "text" && typeof node.text === "string";

const isPlainText = (node: unknown) =>
  isText(node) && !node.format && !node.style;

const isInlineElement = (node: unknown) =>
  isRecord(node) &&
  typeof node.type === "string" &&
  INLINE_ELEMENTS.has(node.type);

const isBlock = (node: LexicalNode) =>
  childrenOf(node).some((child) => isText(child) || isInlineElement(child));

/**
 * One block as a placeholder string. `placeholders[n]` is the source node
 * behind `<n>`, and `plain` is the node plain text is cloned from on the way
 * back.
 */
function serializeBlock(block: LexicalNode) {
  const placeholders: LexicalNode[] = [];
  let plain: LexicalNode | undefined;

  const serialize = (nodes: unknown[]): string =>
    nodes
      .map((node) => {
        if (!isRecord(node)) return "";
        if (isPlainText(node)) {
          plain ??= node;
          return node.text as string;
        }
        const id = placeholders.push(node) - 1;
        if (isText(node)) return `<${id}>${node.text}</${id}>`;
        if (isInlineElement(node))
          return `<${id}>${serialize(childrenOf(node))}</${id}>`;
        return `<${id}/>`;
      })
      .join("");

  const text = serialize(childrenOf(block));
  return { text, placeholders, plain: plain ?? DEFAULT_TEXT };
}

/**
 * Inverse of `serializeBlock`, or `null` when the translation does not use
 * every placeholder exactly once with the right shape.
 */
function parseBlock(
  translation: string,
  placeholders: LexicalNode[],
  plain: LexicalNode,
): unknown[] | null {
  const tokens = translation.split(PLACEHOLDER);
  // `split` with 3 capture groups yields [text, void, open, close, text, ...].
  let i = 0;
  const used = new Set<number>();

  const take = (id: string | undefined) => {
    const n = Number(id);
    if (used.has(n) || !placeholders[n]) return null;
    used.add(n);
    return placeholders[n];
  };

  const parse = (closing?: string): unknown[] | null => {
    const out: unknown[] = [];
    while (i < tokens.length) {
      const text = tokens[i];
      const [selfClosing, open, close] = tokens.slice(i + 1, i + 4);
      i += 4;
      if (text) out.push({ ...plain, text });

      if (close !== undefined) return close === closing ? out : null;
      if (selfClosing !== undefined) {
        const node = take(selfClosing);
        if (!node || isText(node) || isInlineElement(node)) return null;
        out.push(node);
      } else if (open !== undefined) {
        const node = take(open);
        const inner = node && parse(open);
        if (!node || !inner) return null;
        if (isInlineElement(node)) {
          out.push({ ...node, children: inner });
        } else if (isText(node) && inner.every(isPlainText)) {
          out.push({
            ...node,
            text: inner.map((child) => (child as LexicalNode).text).join(""),
          });
        } else {
          return null;
        }
      }
    }
    return closing === undefined ? out : null;
  };

  const children = parse();
  return children && used.size === placeholders.length ? children : null;
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
    const { text } = serializeBlock(node);
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
  let broken = false;

  const rebuild = (node: unknown, path: number[]): unknown => {
    if (!isRecord(node)) return node;
    const translation = texts.get(path.join("."));
    if (translation !== undefined && isBlock(node)) {
      const { placeholders, plain } = serializeBlock(node);
      const children = parseBlock(translation, placeholders, plain);
      if (!children) broken = true;
      return { ...node, children: children ?? node.children };
    }
    return {
      ...node,
      ...(Array.isArray(node.children) && {
        children: node.children.map((child, i) => rebuild(child, [...path, i])),
      }),
    };
  };

  const root = lexicalRoot(source);
  if (!root) return source;
  const result = { ...(source as LexicalNode), root: rebuild(root, []) };
  return broken ? undefined : result;
}
