"use client";

import { useState } from "react";
import {
  Card,
  HStack,
  Heading,
  Image,
  CloseButton,
  Separator,
  Button,
  Link,
} from "@chakra-ui/react";

interface RemovableCardProps {
  imageUrl: string;
  heading: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
}

export default function RemovableCard({
  imageUrl,
  heading,
  description,
  buttonText,
  buttonUrl,
}: RemovableCardProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <Card.Root flexDirection="row" size="lg" coloredBg>
      <Image src={imageUrl} alt="removable card image" maxW="1/3" />
      <Card.Body>
        <HStack justifyContent="space-between">
          <Heading size="4xl">{heading}</Heading>
          <CloseButton onClick={() => setVisible(false)} />
        </HStack>
        <Separator size="md" />
        <Card.Description>{description}</Card.Description>
        <Button asChild alignSelf="start">
          <Link href={buttonUrl}>{buttonText}</Link>
        </Button>
      </Card.Body>
    </Card.Root>
  );
}
