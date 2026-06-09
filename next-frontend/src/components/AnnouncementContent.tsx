"use client";

import { useState } from "react";
import { Button } from "@chakra-ui/react";
import { Accordion } from "@chakra-ui/react";
import { ChakraMarkdown } from "@/components/Markdown";

// Arbitrary starting value; to be fine-tuned once the feature exists.
const CHARACTER_LIMIT = 400;

// Truncates `text` to `limit` characters without cutting a word in half: the
// word that reaches the limit is kept whole, then an ellipsis is appended.
// Returns `null` when the text is short enough that no truncation is needed.
function truncateToWord(text: string, limit: number): string | null {
  if (text.length <= limit) {
    return null;
  }

  let end = limit;
  while (end < text.length && !/\s/.test(text[end])) {
    end += 1;
  }

  return `${text.slice(0, end).trimEnd()}...`;
}

export default function AnnouncementContent({
  contentMarkdown,
}: {
  contentMarkdown: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const truncated = truncateToWord(contentMarkdown, CHARACTER_LIMIT);
  const showReadMore = truncated !== null;

  return (
    <>
      <ChakraMarkdown paragraphAs={Accordion.ItemBody} textStyle="body">
        {expanded || !showReadMore ? contentMarkdown : truncated!}
      </ChakraMarkdown>

      {showReadMore && (
        <Button
          variant="ghost"
          size="sm"
          alignSelf="flex-start"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "Read Less" : "Read More"}
        </Button>
      )}
    </>
  );
}