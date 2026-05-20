import { ComponentPropsWithoutRef } from "react";
import { Image, Card } from "@chakra-ui/react";

type CardRootProps = ComponentPropsWithoutRef<typeof Card.Root>;

type MarkdownFirstImageProps = {
  content: string;
  alt?: string;
} & CardRootProps;

export const markDownFirstImageUrl = (content: string) => {
  const match = content.match(/!\[.*?\]\((.*?)\)/);

  return match?.[1];
};

export const MarkdownFirstImage = ({
  content,
  alt = "Image",
  ...cardRootProps
}: MarkdownFirstImageProps) => {
  const imageUrl = markDownFirstImageUrl(content);

  if (!imageUrl) return null;

  return (
    <Card.Root maxWidth="md" {...cardRootProps}>
      <Card.Body justifyContent="center">
        <Image src={imageUrl} alt={alt} maxW="xs" borderRadius="md" />
      </Card.Body>
    </Card.Root>
  );
};
