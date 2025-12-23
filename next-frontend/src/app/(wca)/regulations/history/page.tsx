"use server";

import { Container, Heading, VStack, Text, Link, List } from "@chakra-ui/react";
import { getPayload } from "payload";
import config from "@payload-config";
import { getT } from "@/lib/i18n/get18n";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    // This is currently hardcoded in Rails
    title: t("WCA Regulations History"),
  };
}
export default async function RegulationsHistory() {
  const { i18n } = await getT();

  const payload = await getPayload({ config });

  const regulationsHistory = await payload.find({
    collection: "regulationsHistoryItem",
    limit: 0,
    depth: 1,
  });

  const regulationsHistoryItems = regulationsHistory.docs
    .sort((a, b) =>
      a.version.localeCompare(b.version, i18n.language, {
        numeric: true,
        sensitivity: "base",
      }),
    )
    .reverse();

  if (regulationsHistoryItems.length === 0) {
    return <Heading>No Regulation History Items, add some!</Heading>;
  }

  return (
    <Container bg="bg">
      <VStack gap="8" pt="8" alignItems="left">
        <Heading size="5xl">WCA Regulations</Heading>
        <Heading size="2xl">Older Versions of the Regulations</Heading>
        <Text>
          Until 2011, the Regulations were maintained by Ron van Bruchem and the
          WCA Board. Since then, the{" "}
          <Link href="mailto:wrc@worldcubeassociation.org">
            WCA Regulations Committee
          </Link>{" "}
          is in charge of them.
        </Text>
        <Text>
          Previously, from the January 1st, 2013 release until the January 1st,
          2025 release, the WCA Regulations were split into the WCA Regulations
          and the WCA Guidelines. The former contents of both documents were
          combined into the WCA Regulations for the July 17th, 2025 release.
        </Text>
        <List.Root>
          {regulationsHistoryItems.map((item) => (
            <List.Item key={item.id}>
              <Link href={item.url}>{item.version}</Link>{" "}
              {item.changesUrl && (
                <Text>
                  (<Link href={item.changesUrl}>Changes</Link>
                  {item.summarizedChangesUrl && (
                    <Link href={item.summarizedChangesUrl}>
                      , Summarized Changes
                    </Link>
                  )}
                  )
                </Text>
              )}
            </List.Item>
          ))}
        </List.Root>
        <Text>
          Current updates to the Regulations are available{" "}
          <Link href="https://github.com/thewca/wca-regulations/">
            on GitHub
          </Link>
        </Text>
      </VStack>
    </Container>
  );
}
