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
  CardBody,
  CardDescription,
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
    <Card.Root variant="info" flexDirection="row" overflow="hidden" size="lg">
      <Image src={imageUrl} alt="removable card image" maxW="1/3" />
      <CardBody>
        <HStack justifyContent="space-between">
          <Heading size="4xl">{heading}</Heading>
          <CloseButton onClick={() => setVisible(false)} />
        </HStack>
        <Separator size="md" />
        <CardDescription>{description}</CardDescription>
        <Button as={Link} href={buttonUrl} alignSelf="start">
          {buttonText}
        </Button>
      </CardBody>
    </Card.Root>
  );
}
