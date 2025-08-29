"use client";

import {
  Box,
  Button,
  ButtonGroup,
  Container,
  Link,
  Stack,
} from "@chakra-ui/react";
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
    <Container
      borderRadius="2xl"
      p={{ base: 6, md: 10 }}
      shadow="md"
      bg="bg"
      fluid
    >
      <Stack direction="column">
        <Box color="gray.700" fontSize="lg">
          <MarkdownProse content={content} />
        </Box>

        <Stack direction={{ base: "column", sm: "row" }}>
          <ButtonGroup colorScheme="blue" size="lg">
            {buttons.map((button, i) => (
              <Button key={i} variant={i === 0 ? "solid" : "outline"} asChild>
                <Link href={button.url} target="_blank" rel="noopener">
                  {button.label}
                </Link>
              </Button>
            ))}
          </ButtonGroup>
        </Stack>
      </Stack>
    </Container>
  );
}
