import { Box, Heading, Image as ChakraImage, Stack } from "@chakra-ui/react";
import { MarkdownProse } from "@/components/Markdown";
import type { Media } from "@/types/payload";
import Image from "next/image";

type SimpleItemBlockProps = {
  title: string;
  contentMarkdown: string;
  image?: Media;
};

export default function AboutUsItem({
  title,
  contentMarkdown,
  image,
}: SimpleItemBlockProps) {
  return (
    <Stack
      direction={{ base: "column", md: "row" }}
      gap={8}
      justify="space-between"
    >
      <Stack direction="column">
        <Heading size="lg">{title}</Heading>
        <MarkdownProse content={contentMarkdown} />
      </Stack>

      {image?.url && (
        <Box position="relative" maxW="500px" w="full">
          <ChakraImage asChild borderRadius="1rem">
            <Image src={image.url} alt={image.alt || title} fill />
          </ChakraImage>
        </Box>
      )}
    </Stack>
  );
}
