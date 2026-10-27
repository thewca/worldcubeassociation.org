/**
 * Mapping Lexical rich text to and from flat translation units.
 *
 * Rather than shipping Lexical JSON to translators (which is what forced the
 * prototype to hand-roll an editor), each *text node* becomes its own unit,
 * keyed by its index path in the tree:
 *
 *   home:body            -> plain field
 *   home:body#0.1.0      -> the text node at root.children[0].children[1].children[0]
 *
 * Translators therefore see plain sentences. On write-back we copy the
 * **source** state and substitute only `text` values, so structure, node
 * `version`s and any node type we have never heard of come from Payload itself.
 * A Payload or Lexical upgrade cannot corrupt a write, because we never author
 * the structure.
 *
 * Payload's own `convertLexicalToPlaintext` is not a substitute: it flattens an
 * editor state to one string, which is lossy and cannot be written back.
 */
import { isRecord } from "./registry";

function lexicalRoot(value: unknown): Record<string, unknown> | null {
  return isRecord(value) && isRecord(value.root) ? value.root : null;
}

/** Every non-blank text node in a Lexical value, with its index path. */
export function lexicalTextNodes(
  value: unknown,
): { path: string; text: string }[] {
  const visit = (
    node: unknown,
    path: number[],
  ): { path: string; text: string }[] => {
    if (!isRecord(node)) return [];
    const self =
      node.type === "text" && typeof node.text === "string" && node.text.trim()
        ? [{ path: path.join("."), text: node.text }]
        : [];
    const children = Array.isArray(node.children)
      ? node.children.flatMap((child, i) => visit(child, [...path, i]))
      : [];
    return [...self, ...children];
  };

  const root = lexicalRoot(value);
  if (!root || !Array.isArray(root.children)) return [];
  return root.children.flatMap((child, i) => visit(child, [i]));
}

/** Copy `source`, replacing the text of every node named in `texts`. */
export function applyLexicalTexts(
  source: unknown,
  texts: Map<string, string>,
): unknown {
  const rebuild = (node: unknown, path: number[]): unknown => {
    if (!isRecord(node)) return node;
    const replacement =
      node.type === "text" && typeof node.text === "string"
        ? texts.get(path.join("."))
        : undefined;
    return {
      ...node,
      ...(replacement !== undefined && { text: replacement }),
      ...(Array.isArray(node.children) && {
        children: node.children.map((child, i) => rebuild(child, [...path, i])),
      }),
    };
  };
  return isRecord(source) && isRecord(source.root)
    ? { ...source, root: rebuild(source.root, []) }
    : source;
}
