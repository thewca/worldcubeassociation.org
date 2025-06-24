"use server";

import { Container, Heading, VStack, Text, Link, List } from "@chakra-ui/react";
import { getPayload } from "payload";
import config from "@payload-config";
export default async function SpeedcubingHistory() {
  const payload = await getPayload({ config });

  const regulationsHistory = await payload.find({
    collection: "regulationsHistoryItem",
    limit: 0,
    depth: 1,
  });
  const regulationsHistoryItems = regulationsHistory.docs
    .sort((a, b) =>
      a.version.localeCompare(b.version, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    )
    .reverse();

  if (regulationsHistoryItems.length === 0) {
    return <Heading>No Regulation History Items, add some!</Heading>;
  }

  return (
    <Container>
      <VStack gap="8" width="full" pt="8" alignItems="left">
        <Heading size="5xl">WCA Regulations and Guidelines</Heading>
        <Heading size="2xl">Older Versions of the Regulations</Heading>
        <Text>
          Until 2011, the Regulations were maintained by Ron van Bruchem and the
          WCA Board. Since then, the{" "}
          <Link href={"mailto:wrc@worldcubeassociation.org"}>
            WCA Regulations Committee
          </Link>{" "}
          is in charge of them.
        </Text>
        <Text>
          For the 2013 release, the Regulations were split into two documents:
          the Regulations and the Guidelines.
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
          Current updates to the Regulations and Guidelines are available{" "}
          <Link href={"https://github.com/thewca/wca-regulations/"}>
            on GitHub
          </Link>
        </Text>
      </VStack>
    </Container>
  );
}
