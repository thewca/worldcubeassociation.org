import { Heading, Link, List, Text, VStack } from "@chakra-ui/react";
import { findCached } from "@/lib/payload/collections";
import { getT } from "@/lib/i18n/get18n";
import { Metadata } from "next";
import TransWithLinks from "@/components/TransWithLinks";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("layouts.navigation.history"),
  };
}
export default async function RegulationsHistory() {
  const { t, i18n, lng } = await getT();

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
        {/* eslint-disable-line no-restricted-syntax -- Backoffice-only text */}
        No Regulation History Items, add some!
      </Heading>
    );
  }

  return (
    <VStack gap="8" alignItems="left">
      <Heading size="5xl">{t("regulations_history.title")}</Heading>
      <Heading size="2xl">{t("regulations_history.older_versions")}</Heading>
      <Text>
        <TransWithLinks i18nKey="regulations_history.maintainers_html" />
      </Text>
      <Text>{t("regulations_history.guidelines_merge")}</Text>
      <List.Root indented>
        {regulationsHistoryItems.map((item) => (
          <List.Item key={item.id}>
            <Link href={item.url}>{item.version}</Link>{" "}
            {item.changesUrl && (
              <Text>
                (
                <Link href={item.changesUrl}>
                  {t("regulations_history.changes")}
                </Link>
                {item.summarizedChangesUrl && (
                  <>
                    {", "}
                    <Link href={item.summarizedChangesUrl}>
                      {t("regulations_history.summarized_changes")}
                    </Link>
                  </>
                )}
                )
              </Text>
            )}
          </List.Item>
        ))}
      </List.Root>
      <Text>
        <TransWithLinks i18nKey="regulations_history.current_updates_html" />
      </Text>
    </VStack>
  );
}
