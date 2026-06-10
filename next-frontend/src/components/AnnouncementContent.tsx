"use client";

import { useState } from "react";
import { Button } from "@chakra-ui/react";
import { Accordion } from "@chakra-ui/react";
import _ from "lodash";
import { ChakraMarkdown } from "@/components/Markdown";

// Arbitrary starting value; to be fine-tuned once the feature exists.
const CHARACTER_LIMIT = 400;

export default function AnnouncementContent({
  contentMarkdown,
}: {
  contentMarkdown?: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  const truncated = _.truncate(contentMarkdown ?? "", {
    length: CHARACTER_LIMIT,
    separator: /\s+/,
    omission: "…",
  });

  const showReadMore = truncated !== contentMarkdown;

  return (
    <>
      <ChakraMarkdown paragraphAs={Accordion.ItemBody} textStyle="body">
        {expanded || !showReadMore ? contentMarkdown : truncated}
      </ChakraMarkdown>

      {showReadMore && (
        <Accordion.ItemBody>
          <Button
            variant="ghost"
            size="sm"
            alignSelf="flex-start"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? "Read Less" : "Read More"}
          </Button>
        </Accordion.ItemBody>
      )}
    </>
  );
}
