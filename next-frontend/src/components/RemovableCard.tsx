"use client";

import type { ReactNode } from "react";
import {
  Card,
  HStack,
  Image,
  CloseButton,
  Separator,
  Button,
  Link,
  Box,
} from "@chakra-ui/react";
import useStoredState from "@/lib/hooks/useStoredState";

interface RemovableCardProps {
  storageKey: string;
  imageUrl: string;
  heading: string;
  description: ReactNode;
  descriptionAs?: Card.DescriptionProps["as"];
  buttonText: string;
  buttonUrl: string;
}

export default function RemovableCard({
  storageKey,
  imageUrl,
  heading,
  description,
  descriptionAs,
  buttonText,
  buttonUrl,
}: RemovableCardProps) {
  const [dismissed, setDismissed] = useStoredState(false, storageKey);

  if (dismissed) return null;

  return (
    <Card.Root
      flexDirection="row"
      size="lg"
      overflow="hidden"
      colorVariant="solid"
      colorPalette="wcaWhite"
    >
      <Image src={imageUrl} alt="" maxW="1/3" />
      <Box width="2/3">
        <Card.Body>
          <HStack justifyContent="space-between">
            <Card.Title>{heading}</Card.Title>
            <CloseButton variant="subtle" onClick={() => setDismissed(true)} />
          </HStack>
          <Separator size="md" />
          <Card.Description as={descriptionAs}>{description}</Card.Description>
        </Card.Body>
        <Card.Footer>
          <Button asChild variant="outline">
            <Link href={buttonUrl}>{buttonText}</Link>
          </Button>
        </Card.Footer>
      </Box>
    </Card.Root>
  );
}
