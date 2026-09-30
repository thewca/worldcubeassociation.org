import { Card, Text } from "@chakra-ui/react";

import { getTabs } from "@/lib/wca/competitions/getTabs";
import React from "react";
import { ChakraMarkdown } from "@/components/Markdown";
import OpenapiError from "@/components/ui/openapiError";
import { getT } from "@/lib/i18n/get18n";
import { cacheLife } from "next/cache";

export default async function Tab({
  params,
}: {
  params: Promise<{ competitionId: string; tabName: string }>;
}) {
  const { competitionId, tabName } = await params;
  const { t } = await getT();

  const { data: tabs, error, response } = await getTabs(competitionId);

  if (error) return <OpenapiError t={t} response={response} />;

  if (!tabs) {
    return <Text>Competition does not exist</Text>;
  }

  const tab = tabs.find((t) => t.name === decodeURIComponent(tabName));

  if (!tab) {
    return <Text>Tab does not exist</Text>;
  }

  return <TabContent content={tab.content} />;
}

// Keyed on the markdown itself, so the parsed output is reused until an organizer edits the tab.
//   `getT` reads cookies and cannot run in here, which is why the error path stays in the page.
async function TabContent({ content }: { content: string }) {
  "use cache";
  cacheLife("max");

  return (
    <Card.Root>
      <Card.Body>
        <ChakraMarkdown headingAs={Card.Title} paragraphAs={Card.Description}>
          {content}
        </ChakraMarkdown>
      </Card.Body>
    </Card.Root>
  );
}
