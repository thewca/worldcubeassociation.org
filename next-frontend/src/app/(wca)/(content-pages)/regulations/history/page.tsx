import { Heading, Link, List, Text, VStack } from "@chakra-ui/react";
import { findCached } from "@/lib/payload/collections";
import { getT } from "@/lib/i18n/get18n";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("layouts.navigation.history"),
  };
}
export default async function RegulationsHistory() {
  const { i18n, lng } = await getT();

  const regulationsHistory = await findCached("regulationsHistoryItem", {
    locale: lng,
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
    return (
      <Heading>
        {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
        No Regulation History Items, add some!
      </Heading>
    );
  }

  return (
    <VStack gap="8" alignItems="left">
      <Heading size="5xl">
        {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
        WCA Regulations
      </Heading>
      <Heading size="2xl">
        {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
        Older Versions of the Regulations
      </Heading>
      <Text>
        {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
        Until 2011, the Regulations were maintained by Ron van Bruchem and the
        WCA Board. Since then, the{" "}
        <Link href="mailto:wrc@worldcubeassociation.org">
          {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
          WCA Regulations Committee
        </Link>{" "}
        {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
        is in charge of them.
      </Text>
      <Text>
        {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
        Previously, from the January 1st, 2013 release until the January 1st,
        2025 release, the WCA Regulations were split into the WCA Regulations
        and the WCA Guidelines. The former contents of both documents were
        combined into the WCA Regulations for the July 17th, 2025 release.
      </Text>
      <List.Root indented>
        {regulationsHistoryItems.map((item) => (
          <List.Item key={item.id}>
            <Link href={item.url}>{item.version}</Link>{" "}
            {item.changesUrl && (
              <Text>
                (
                <Link href={item.changesUrl}>
                  {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
                  Changes
                </Link>
                {item.summarizedChangesUrl && (
                  <Link href={item.summarizedChangesUrl}>
                    {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
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
        {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
        Current updates to the Regulations are available{" "}
        <Link href="https://github.com/thewca/wca-regulations/">
          {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
          on GitHub
        </Link>
      </Text>
    </VStack>
  );
}
