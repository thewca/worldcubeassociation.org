import { Avatar, Box, HStack, Text, VStack } from "@chakra-ui/react";
import WcaFlag from "@/components/WcaFlag";
import type { components } from "@/types/openapi";
import type { TFunction } from "i18next";

type SearchResult = components["schemas"]["SearchResult"];

export default function SearchResultContent({
  result,
  t,
}: {
  result: SearchResult;
  t: TFunction;
}) {
  switch (result.class) {
    case "competition":
      return (
        <VStack align="start" gap={0}>
          <Text textStyle="bodyEmphasis">{result.name}</Text>
          <HStack gap={1} fontSize="sm">
            {result.country_iso2 && (
              <WcaFlag code={result.country_iso2} width={18} />
            )}
            <Text>{`${result.city} (${result.id})`}</Text>
          </HStack>
        </VStack>
      );
    case "person":
      return (
        <HStack gap={2}>
          <Avatar.Root size="xs">
            <Avatar.Fallback name={result.name} />
            {result.avatar && !result.avatar.is_default && (
              <Avatar.Image
                src={result.avatar.thumb_url ?? result.avatar.url}
              />
            )}
          </Avatar.Root>
          <VStack align="start" gap={0}>
            <Text textStyle="bodyEmphasis">{result.name}</Text>
            {result.wca_id && <Text fontSize="sm">{result.wca_id}</Text>}
          </VStack>
        </HStack>
      );
    case "regulation":
      return (
        <HStack gap={1}>
          <Text textStyle="bodyEmphasis">{result.id}:</Text>
          <Box
            // Regulation content is trusted, sanitized WCA content.
            dangerouslySetInnerHTML={{ __html: result.content_html ?? "" }}
          />
        </HStack>
      );
    case "incident":
      return (
        <Text>
          <Text as="span" textStyle="bodyEmphasis">
            {t("incidents_log.incident")}
          </Text>
          {` ${result.title}`}
        </Text>
      );
  }
}
