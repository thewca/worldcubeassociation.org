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
 * Translators therefore see plain sentences. On write-back we deep-clone the
 * **source** state and substitute only `text` values, so structure, node
 * `version`s and any node type we have never heard of come from Payload itself.
 * A Payload or Lexical upgrade cannot corrupt a write, because we never author
 * the structure.
 *
 * Payload's own `convertLexicalToPlaintext` is not a substitute: it flattens an
 * editor state to one string, which is lossy and cannot be written back.
 */

interface LexicalNode {
  type?: string;
  text?: string;
  children?: unknown[];
}

function lexicalRoot(value: unknown): LexicalNode | null {
  const root = (value as { root?: unknown } | null | undefined)?.root;
  return root && typeof root === "object" ? (root as LexicalNode) : null;
}

/** Every non-blank text node in a Lexical value, with its index path. */
export function lexicalTextNodes(
  value: unknown,
): { path: string; text: string }[] {
  const visit = (
    node: unknown,
    path: number[],
  ): { path: string; text: string }[] => {
    if (!node || typeof node !== "object") return [];
    const n = node as LexicalNode;
    const self =
      n.type === "text" && typeof n.text === "string" && n.text.trim()
        ? [{ path: path.join("."), text: n.text }]
        : [];
    const children = Array.isArray(n.children)
      ? n.children.flatMap((child, i) => visit(child, [...path, i]))
      : [];
    return [...self, ...children];
  };

  const root = lexicalRoot(value);
  if (!root || !Array.isArray(root.children)) return [];
  return root.children.flatMap((child, i) => visit(child, [i]));
}

/** Clone `source` and replace the text of every node named in `texts`. */
export function applyLexicalTexts(
  source: unknown,
  texts: Map<string, string>,
): unknown {
  const clone = structuredClone(source);
  const visit = (node: unknown, path: number[]): void => {
    if (!node || typeof node !== "object") return;
    const n = node as LexicalNode;
    if (n.type === "text" && typeof n.text === "string") {
      const replacement = texts.get(path.join("."));
      if (replacement !== undefined) n.text = replacement;
    }
    if (Array.isArray(n.children)) {
      n.children.forEach((child, i) => visit(child, [...path, i]));
    }
  };
  const root = lexicalRoot(clone);
  if (root && Array.isArray(root.children)) {
    root.children.forEach((child, i) => visit(child, [i]));
  }
  return clone;
}
