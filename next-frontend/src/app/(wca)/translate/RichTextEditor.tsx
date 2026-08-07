"use client";

import { useEffect, useState } from "react";
import { Box, Button, HStack } from "@chakra-ui/react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode, QuoteNode, $createHeadingNode } from "@lexical/rich-text";
import {
  ListNode,
  ListItemNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import { LinkNode, AutoLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { $setBlocksType } from "@lexical/selection";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  type EditorState,
  type SerializedEditorState,
} from "lexical";

// a minimal Lexical editor for the standard prose feature set
// (headings, formatting, lists, links) — NOT Payload's full node set. Content
// using nodes we don't register here (uploads, relationships, custom blocks)
// can't be parsed, so LoadStatePlugin falls back to read-only flattened text
// rather than crashing. Register more nodes / use Payload's editor if those
// node types start showing up in translatable fields.
const NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
];

const THEME = {
  text: {
    underline: "tr-underline",
    strikethrough: "tr-strike",
    underlineStrikethrough: "tr-underline tr-strike",
  },
  link: "tr-link",
};

/** Flatten Lexical JSON to plain text, used as the fallback when parsing fails. */
function flatten(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as Record<string, unknown>;
  let text = typeof n.text === "string" ? n.text : "";
  const children = (n.children ??
    (n.root as Record<string, unknown> | undefined)?.children) as
    | unknown[]
    | undefined;
  if (Array.isArray(children)) for (const c of children) text += flatten(c);
  return text;
}

/** Load the initial Lexical state once; flip to fallback if it can't be parsed. */
function LoadStatePlugin({
  value,
  onFail,
}: {
  value: SerializedEditorState | null;
  onFail: () => void;
}) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (!value) return;
    try {
      editor.setEditorState(editor.parseEditorState(value));
    } catch {
      onFail();
    }
    // Run once on mount: this is the initial seed, later edits are the user's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const block = (tag: "h2" | "p") =>
    editor.update(() => {
      const sel = $getSelection();
      if ($isRangeSelection(sel)) {
        $setBlocksType(sel, () =>
          tag === "p" ? $createParagraphNode() : $createHeadingNode(tag),
        );
      }
    });
  const link = () => {
    const url = window.prompt("Link URL (leave blank to remove)") ?? "";
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url || null);
  };
  return (
    <HStack gap="1" wrap="wrap" mb="1">
      <Button
        size="2xs"
        variant="outline"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        fontWeight="bold"
      >
        B
      </Button>
      <Button
        size="2xs"
        variant="outline"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        fontStyle="italic"
      >
        I
      </Button>
      <Button
        size="2xs"
        variant="outline"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        textDecoration="underline"
      >
        U
      </Button>
      <Button size="2xs" variant="outline" onClick={() => block("h2")}>
        H2
      </Button>
      <Button size="2xs" variant="outline" onClick={() => block("p")}>
        P
      </Button>
      <Button
        size="2xs"
        variant="outline"
        onClick={() =>
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
        }
      >
        • List
      </Button>
      <Button
        size="2xs"
        variant="outline"
        onClick={() =>
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
        }
      >
        1. List
      </Button>
      <Button size="2xs" variant="outline" onClick={link}>
        Link
      </Button>
    </HStack>
  );
}

export default function RichTextEditor({
  value,
  editable = true,
  onChange,
}: {
  value: SerializedEditorState | null;
  editable?: boolean;
  onChange?: (state: SerializedEditorState) => void;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    // Unsupported content: show read-only flattened text so nothing is lost.
    return (
      <Box
        whiteSpace="pre-wrap"
        color="fg.muted"
        fontSize="sm"
        p="2"
        borderWidth="1px"
        borderRadius="md"
      >
        {flatten(value) || "—"}
      </Box>
    );
  }

  return (
    <LexicalComposer
      initialConfig={{
        namespace: "translate",
        nodes: NODES,
        theme: THEME,
        editable,
        onError: () => setFailed(true),
      }}
    >
      {editable && <Toolbar />}
      <Box
        borderWidth="1px"
        borderRadius="md"
        px="3"
        py="2"
        minH={editable ? "24" : undefined}
        bg={editable ? "bg" : "bg.subtle"}
        css={{
          "& .tr-underline": { textDecoration: "underline" },
          "& .tr-strike": { textDecoration: "line-through" },
          "& .tr-link": { color: "blue.500", textDecoration: "underline" },
          "& h1": { fontSize: "1.25rem", fontWeight: "bold" },
          "& h2": { fontSize: "1.1rem", fontWeight: "bold" },
          "& ul": { listStyle: "disc", paddingLeft: "1.5rem" },
          "& ol": { listStyle: "decimal", paddingLeft: "1.5rem" },
          "& a": { color: "blue.500", textDecoration: "underline" },
        }}
      >
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              style={{ outline: "none", whiteSpace: "pre-wrap" }}
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
      </Box>
      <LoadStatePlugin value={value} onFail={() => setFailed(true)} />
      <HistoryPlugin />
      <ListPlugin />
      <LinkPlugin />
      {onChange && (
        <OnChangePlugin
          onChange={(state: EditorState) => onChange(state.toJSON())}
        />
      )}
    </LexicalComposer>
  );
}
