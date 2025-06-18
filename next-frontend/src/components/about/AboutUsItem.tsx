import { Box, Flex, Heading, VStack, Image, HStack } from "@chakra-ui/react";
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
    <HStack
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
            borderRadius={"1rem"}
            objectFit="cover"
          />
        </Box>
      )}
    </HStack>
  );
}
