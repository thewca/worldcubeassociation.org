"use client";

import { type ReactNode, useState } from "react";
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

interface RemovableCardProps {
  imageUrl: string;
  heading: string;
  description: ReactNode;
  descriptionAs?: Card.DescriptionProps["as"];
  buttonText: string;
  buttonUrl: string;
}

export default function RemovableCard({
  imageUrl,
  heading,
  description,
  descriptionAs,
  buttonText,
  buttonUrl,
}: RemovableCardProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <Card.Root
      flexDirection="row"
      size="lg"
      overflow="hidden"
      colorVariant="solid"
      colorPalette="wcaWhite"
    >
      <Image src={imageUrl} alt="removable card image" maxW="1/3" />
      <Box width="2/3">
        <Card.Body>
          <HStack justifyContent="space-between">
            <Card.Title>{heading}</Card.Title>
            <CloseButton variant="subtle" onClick={() => setVisible(false)} />
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
