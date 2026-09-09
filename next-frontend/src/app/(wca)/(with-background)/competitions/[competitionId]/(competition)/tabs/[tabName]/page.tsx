import { Card, Text } from "@chakra-ui/react";

import { getTabs } from "@/lib/wca/competitions/getTabs";
import React from "react";
import { ChakraMarkdown } from "@/components/Markdown";
import OpenapiError from "@/components/ui/openapiError";
import { getT } from "@/lib/i18n/get18n";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

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

  return (
    <Card.Root>
      <Card.Body>
        <ChakraMarkdown headingAs={Card.Title} paragraphAs={Card.Description}>
          {tab.content}
        </ChakraMarkdown>
      </Card.Body>
    </Card.Root>
  );
}
