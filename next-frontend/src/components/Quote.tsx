"use client";

import { Blockquote } from "@chakra-ui/react";
import { MarkdownProse } from "@/components/Markdown";

export default function Quote({
  content,
  author,
}: {
  content: string;
  author: string;
}) {
  return (
    <Blockquote.Root>
      <Blockquote.Content cite={author}>
        <MarkdownProse content={content} />
      </Blockquote.Content>
      <Blockquote.Caption>
        — <cite>{author}</cite>
      </Blockquote.Caption>
    </Blockquote.Root>
  );
}
