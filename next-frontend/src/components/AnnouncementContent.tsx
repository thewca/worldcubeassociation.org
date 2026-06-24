"use client";

import { useState } from "react";
import { Button, Link as ChakraLink } from "@chakra-ui/react";
import { Accordion } from "@chakra-ui/react";
import _ from "lodash";
import { ChakraMarkdown } from "@/components/Markdown";

// Arbitrary starting value; to be fine-tuned once the feature exists.
const CHARACTER_LIMIT = 400;

export default function AnnouncementContent({
  contentMarkdown,
  url,
}: {
  contentMarkdown?: string | null;
  url?: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  const truncated = _.truncate(contentMarkdown ?? "", {
    length: CHARACTER_LIMIT,
    separator: /\s+/,
    omission: "…",
  });

  const isTruncated = truncated !== contentMarkdown;
  const showReadMore = isTruncated || Boolean(url);

  return (
    <>
      <ChakraMarkdown paragraphAs={Accordion.ItemBody} textStyle="body">
        {expanded || !isTruncated ? contentMarkdown : truncated}
      </ChakraMarkdown>

      {showReadMore && (
        <Accordion.ItemBody>
          {url ? (
            <Button
              variant="pastelSolid"
              size="sm"
              alignSelf="flex-start"
              asChild
            >
              <ChakraLink href={url} color="currentColor">
                Read More
              </ChakraLink>
            </Button>
          ) : (
            <Button
              variant="pastelSolid"
              size="sm"
              alignSelf="flex-start"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? "Read Less" : "Read More"}
            </Button>
          )}
        </Accordion.ItemBody>
      )}
    </>
  );
}
