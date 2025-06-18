"use client";

import { Box, Button, Stack, VStack } from "@chakra-ui/react";
import React from "react";
import { MarkdownProse } from "@/components/Markdown";

type CallToActionBlockProps = {
  content: string;
  buttons: {
    label: string;
    url: string;
  }[];
};

export function CallToActionBlock({
  content,
  buttons,
}: CallToActionBlockProps) {
  return (
    <Box borderRadius="2xl" p={{ base: 6, md: 10 }} shadow="md" width="full">
      <VStack align="start">
        <Box color="gray.700" fontSize="lg">
          <MarkdownProse content={content} />
        </Box>

        <Stack direction={{ base: "column", sm: "row" }}>
          {buttons.map((button, i) => (
            <Button
              key={i}
              as="a"
              colorScheme="blue"
              variant={i === 0 ? "solid" : "outline"}
              size="lg"
              asChild
            >
              <a href={button.label} rel={"noopener"}>
                {button.label}
              </a>
            </Button>
          ))}
        </Stack>
      </VStack>
    </Box>
  );
}
