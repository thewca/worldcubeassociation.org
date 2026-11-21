"use client";

import type { ReactNode } from "react";
import {
  Card,
  HStack,
  Image,
  CloseButton,
  Separator,
  Button,
  Box,
} from "@chakra-ui/react";
import Link, { type LinkProps } from "next/link";
import useStoredState from "@/lib/hooks/useStoredState";

interface RemovableCardProps {
  storageKey: string;
  imageUrl: string;
  heading: string;
  description: ReactNode;
  descriptionAs?: Card.DescriptionProps["as"];
  buttonText: string;
  buttonUrl: LinkProps["href"];
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
      size={{ base: "sm", md: "lg" }}
      overflow="hidden"
      colorVariant="solid"
      colorPalette="wcaWhite"
    >
      <Image
        src={imageUrl}
        alt=""
        maxW="1/3"
        aspectRatio={{ base: "auto", lg: "landscape" }}
      />
      <Box flex="1" minW="0">
        <Card.Body gap={{ base: "3", md: "4" }}>
          <HStack justifyContent="space-between">
            <Card.Title>{heading}</Card.Title>
            <CloseButton
              variant="ghost"
              color="currentColor"
              _hover={{ bg: "colorPalette.contrast/10" }}
              onClick={() => setDismissed(true)}
            />
          </HStack>
          <Separator
            size={{ base: "sm", md: "md" }}
            borderColor="currentColor"
          />
          <Card.Description
            as={descriptionAs}
            textStyle={{ base: "xs", md: "body" }}
          >
            {description}
          </Card.Description>
          <Button
            asChild
            variant="pastelSolid"
            alignSelf="flex-start"
            textStyle={{ base: "xs", md: "sm" }}
          >
            <Link href={buttonUrl}>{buttonText}</Link>
          </Button>
        </Card.Body>
      </Box>
    </Card.Root>
  );
}
