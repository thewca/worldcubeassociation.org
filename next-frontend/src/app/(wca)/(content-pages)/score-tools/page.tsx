import { findCached } from "@/lib/payload/collections";
import {
  Badge,
  Card,
  Heading,
  HoverCard,
  IconButton,
  Link,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { getT } from "@/lib/i18n/get18n";
import type { Tool } from "@/types/payload";
import ExternalLinkIcon from "@/components/icons/ExternalLinkIcon";
import GithubIcon from "@/components/icons/GithubIcon";
import WcaLogoIcon from "@/components/icons/WcaLogoIcon";
import { AiFillQuestionCircle } from "react-icons/ai";
import { CgWebsite } from "react-icons/cg";
import _ from "lodash";
import { Metadata } from "next";
import { Fragment } from "react";

const CATEGORIES = ["before", "during", "after"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("score_tools.title"),
  };
}

export default async function ScoreTools() {
  const { t, lng } = await getT();

  const toolResults = await findCached("tools", {
    limit: 0,
    locale: lng,
  });

  const tools = toolResults.docs;

  if (tools.length === 0) {
    return (
      <Heading>
        {/* eslint-disable-line no-restricted-syntax -- Backoffice-only text */}
        No Tools found. Add some
      </Heading>
    );
  }

  const toolsByCategory = _.groupBy(tools, "category");

  return (
    <VStack gap="8" width="full" alignItems="left">
      <Heading size="5xl">{t("score_tools.title")}</Heading>
      <Text>{t("score_tools.intro.desc")}</Text>
      <Text>{t("score_tools.intro.disclaimer")}</Text>
      <Text>{t("score_tools.intro.used")}</Text>
      {CATEGORIES.map((category) => {
        const categoryTools = toolsByCategory[category];

        if (!categoryTools?.length) return null;

        return (
          <Fragment key={category}>
            <Heading size="2xl">{t(`score_tools.${category}.title`)}</Heading>
            <Text>{t(`score_tools.${category}.desc`)}</Text>
            {categoryTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </Fragment>
        );
      })}
    </VStack>
  );
}

async function ToolCard({ tool }: { tool: Tool }) {
  const { t } = await getT();

  return (
    <Card.Root>
      <Card.Body>
        <Card.Title>
          {tool.name} <Badge>{tool.author}</Badge>
          {tool.isOfficial && (
            <HoverCard.Root openDelay={0} closeDelay={500}>
              <HoverCard.Trigger asChild>
                <IconButton variant="ghost" aria-label={t("logo.title")}>
                  <WcaLogoIcon boxSize={10} color="fg" />
                </IconButton>
              </HoverCard.Trigger>
              <Portal>
                <HoverCard.Positioner>
                  <HoverCard.Content>
                    <HoverCard.Arrow />
                    <Text my="4">{t("score_tools.wca_icon_text")}</Text>
                  </HoverCard.Content>
                </HoverCard.Positioner>
              </Portal>
            </HoverCard.Root>
          )}
        </Card.Title>
        <VStack align="left">
          <Text>{tool.description}</Text>
          <Link href={tool.homepageLink}>
            <CgWebsite /> {t("competitions.competition_info.website")}{" "}
            <ExternalLinkIcon />
          </Link>
          {tool.guideLink && (
            <Link href={tool.guideLink}>
              <AiFillQuestionCircle /> {t("score_tools.guide")}{" "}
              <ExternalLinkIcon />
            </Link>
          )}
          {tool.sourceCodeLink && (
            <Link href={tool.sourceCodeLink}>
              <GithubIcon /> {t("score_tools.sources")} <ExternalLinkIcon />
            </Link>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
