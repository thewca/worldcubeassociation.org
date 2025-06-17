import { Box, Flex, Heading, VStack } from "@chakra-ui/react";
import Image from "next/image";
import { MarkdownProse } from "@/components/Markdown";
import { Media } from "@/types/payload";

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
    <Flex
      direction={{ base: "column", md: "row" }}
      gap={8}
      align="start"
      width="full"
    >
      <VStack align="start" flex="1">
        <Heading size="lg">{title}</Heading>
        <MarkdownProse content={contentMarkdown} />
      </VStack>

      {image?.url && (
        <Box flexShrink={0} flex="1" maxW="500px" w="full">
          <Image
            src={image.url}
            alt={image.alt || title}
            width={800}
            height={400}
            style={{
              width: "100%",
              height: "auto",
              borderRadius: "1rem",
              objectFit: "cover",
            }}
          />
        </Box>
      )}
    </Flex>
  );
}
