import { ComponentPropsWithoutRef } from "react";
import { Image, Card } from "@chakra-ui/react";

type CardRootProps = ComponentPropsWithoutRef<typeof Card.Root>;

type MarkdownFirstImageProps = {
  content: string;
  alt?: string;
} & CardRootProps;

export const MarkdownFirstImage = ({
  content,
  alt = "Image",
  ...cardRootProps
}: MarkdownFirstImageProps) => {
  const match = content.match(/!\[.*?\]\((.*?)\)/);

  if (!match) return null;

  const imageUrl = match[1];

  return (
    <Card.Root maxWidth="md" {...cardRootProps}>
      <Card.Body justifyContent="center">
        <Image src={imageUrl} alt={alt} maxW="xs" borderRadius="md" />
      </Card.Body>
    </Card.Root>
  );
};
