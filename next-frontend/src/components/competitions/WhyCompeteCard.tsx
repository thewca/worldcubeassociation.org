"use client";

import {
  Card,
  HStack,
  Image,
  CloseButton,
  Separator,
  Button,
  Box,
} from "@chakra-ui/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Trans } from "react-i18next";
import useStoredState from "@/lib/hooks/useStoredState";
import { useT } from "@/lib/i18n/useI18n";

const MAX_VIEWS = 3;

export default function WhyCompeteCard() {
  const { t } = useT();
  const [dismissed, setDismissed] = useStoredState(
    false,
    "whyCompeteDismissed",
  );
  const [viewCount, setViewCount] = useStoredState(0, "whyCompeteViewCount");
  const [initialViewCount] = useState(viewCount);
  const isHidden = dismissed || initialViewCount >= MAX_VIEWS;
  const viewRecorded = useRef(false);

  useEffect(() => {
    if (isHidden || viewRecorded.current) return;

    viewRecorded.current = true;
    setViewCount((count) => count + 1);
  }, [isHidden, setViewCount]);

  if (isHidden) return null;

  return (
    <Card.Root
      flexDirection="row"
      size={{ base: "sm", md: "lg" }}
      overflow="hidden"
      colorVariant="solid"
      colorPalette="wcaWhite"
    >
      <Image
        src="newcomer.png"
        alt={t("competitions.index.why_compete_image_alt")}
        maxW="1/3"
        aspectRatio={{ base: "auto", lg: "landscape" }}
      />
      <Box flex="1" minW="0">
        <Card.Body gap={{ base: "3", md: "4" }}>
          <HStack justifyContent="space-between">
            <Card.Title>{t("competitions.index.why_compete_title")}</Card.Title>
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
          <Card.Description as="div" textStyle={{ base: "xs", md: "body" }}>
            <Trans
              t={t}
              i18nKey="competitions.index.why_compete_description_html"
            />
          </Card.Description>
          <Button
            asChild
            variant="pastelSolid"
            alignSelf="flex-start"
            textStyle={{ base: "xs", md: "sm" }}
          >
            <Link href="/faq">{t("homepage.learn_more")}</Link>
          </Button>
        </Card.Body>
      </Box>
    </Card.Root>
  );
}
