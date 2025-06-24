import { getPayload } from "payload";
import config from "@payload-config";
import {
  Container,
  Heading,
  VStack,
  Text,
  Card,
  Link,
  IconButton,
  Portal,
  HoverCard,
} from "@chakra-ui/react";
import { getT } from "@/lib/i18n/get18n";
import type { Tool } from "@/types/payload";
import ExternalLinkIcon from "@/components/icons/ExternalLinkIcon";
import GithubIcon from "@/components/icons/GithubIcon";
import { AiFillQuestionCircle } from "react-icons/ai";
import { Image as ChakraImage } from "@chakra-ui/react";
import Image from "next/image";
import React from "react";
import _ from "lodash";
import { CgWebsite } from "react-icons/cg";

export default async function ScoreTools() {
  const payload = await getPayload({ config });

  const toolResults = await payload.find({
    collection: "tool",
    limit: 0,
  });

  const tools = toolResults.docs;

  if (tools.length === 0) {
    return <Heading>No Tools found. Add some</Heading>;
  }

  const { t } = await getT();

  const toolsByCategory = _.groupBy(tools, "category");

  return (
    <Container>
      <VStack gap="8" width="full" pt="8" alignItems="left">
        <Heading size="5xl">Software tools for WCA competitions</Heading>
        <Text>{t("score_tools.intro.desc")}</Text>
        <Text>{t("score_tools.intro.disclaimer")}</Text>
        <Text>{t("score_tools.intro.used")}</Text>
        <Heading size={"2xl"}>{t("score_tools.before.title")}</Heading>
        <Text>{t("score_tools.before.desc")}</Text>
        {toolsByCategory["before"].map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
        <Heading size={"2xl"}>{t("score_tools.during.title")}</Heading>
        <Text>{t("score_tools.during.desc")}</Text>
        {toolsByCategory["during"].map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
        <Heading size={"2xl"}>{t("score_tools.after.title")}</Heading>
        <Text>{t("score_tools.after.desc")}</Text>
        {toolsByCategory["after"].map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </VStack>
    </Container>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Card.Root>
      <Card.Body>
        <Card.Title>
          {tool.name}{" "}
          {tool.author === "WCA Software Team" && (
            <HoverCard.Root openDelay={0} closeDelay={500}>
              <HoverCard.Trigger>
                <IconButton asChild variant="ghost">
                  <ChakraImage asChild maxW={10}>
                    <Image
                      src="/logo.png"
                      alt="WCA Logo"
                      height={50}
                      width={50}
                    />
                  </ChakraImage>
                </IconButton>
              </HoverCard.Trigger>
              <Portal>
                <HoverCard.Positioner>
                  <HoverCard.Content>
                    <HoverCard.Arrow />
                    <Text my="4">Developed and maintained by the WST</Text>
                  </HoverCard.Content>
                </HoverCard.Positioner>
              </Portal>
            </HoverCard.Root>
          )}
        </Card.Title>
        <VStack align="left">
          <Text>{tool.description}</Text>
          <Link href={tool.toolLink}>
            <CgWebsite /> Website <ExternalLinkIcon />
          </Link>
          {tool.guideLink && (
            <Link href={tool.guideLink}>
              <AiFillQuestionCircle /> Guide <ExternalLinkIcon />
            </Link>
          )}
          {tool.sourceLink && (
            <Link href={tool.sourceLink}>
              <GithubIcon /> Sources <ExternalLinkIcon /> ({tool.author})
            </Link>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
