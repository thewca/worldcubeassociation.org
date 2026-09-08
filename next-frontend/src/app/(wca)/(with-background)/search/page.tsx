import {
  Container,
  EmptyState,
  Heading,
  List,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuSearch } from "react-icons/lu";
import _ from "lodash";
import { Trans } from "react-i18next/TransWithoutContext";
import type { Metadata } from "next";
import { getT } from "@/lib/i18n/get18n";
import OpenapiError from "@/components/ui/openapiError";
import Loading from "@/components/ui/loading";
import SearchResultContent from "@/components/search/SearchResultContent";
import SearchResultLink from "@/components/search/SearchResultLink";
import { getSearchResults } from "@/lib/wca/search/getSearchResults";

// The omni-search API does not cover posts, so unlike the old page we only
// group the four classes it returns.
const SEARCH_SECTIONS = [
  {
    resultClass: "competition",
    titleKey: "search_results.index.competitions",
    notFoundKey: "search_results.index.not_found.competitions",
  },
  {
    resultClass: "person",
    titleKey: "search_results.index.people",
    notFoundKey: "search_results.index.not_found.people",
  },
  {
    resultClass: "regulation",
    titleKey: "search_results.index.regulations_and_guidelines",
    notFoundKey: "search_results.index.not_found.regulations_and_guidelines",
  },
  {
    resultClass: "incident",
    titleKey: "search_results.index.incidents",
    notFoundKey: "search_results.index.not_found.incidents",
  },
] as const;

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { t } = await getT();
  const { q } = await searchParams;

  return { title: q?.trim() || t("common.search_site") };
}

export default async function SearchResults({ searchParams }: SearchPageProps) {
  const { t } = await getT();
  const { q } = await searchParams;

  const query = q?.trim() ?? "";

  if (query === "") {
    return (
      <Container bg="bg">
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <LuSearch />
            </EmptyState.Indicator>
            <EmptyState.Title>
              {t("search_results.index.empty_query")}
            </EmptyState.Title>
          </EmptyState.Content>
        </EmptyState.Root>
      </Container>
    );
  }

  const { data, error, response } = await getSearchResults(query);

  if (error) return <OpenapiError response={response} t={t} />;
  if (!data) return <Loading />;

  const resultsByClass = _.groupBy(data.result, "class");

  return (
    <Container bg="bg">
      <VStack align="stretch" gap="8" py="8">
        <Heading textStyle="h2">
          <Trans
            t={t}
            i18nKey="search_results.index.search_for"
            values={{ search_string: query }}
            components={{ b: <b /> }}
          />
        </Heading>
        {SEARCH_SECTIONS.map(({ resultClass, titleKey, notFoundKey }) => {
          const sectionResults = resultsByClass[resultClass] ?? [];

          return (
            <VStack key={resultClass} align="stretch" gap="3">
              <Heading textStyle="h3">{t(titleKey)}</Heading>
              {sectionResults.length === 0 ? (
                <Text>
                  {`${t(notFoundKey)} `}
                  <Text as="span" textStyle="bodyEmphasis">
                    {query}
                  </Text>
                </Text>
              ) : (
                <List.Root variant="plain" gap="3">
                  {sectionResults.map((result) => (
                    <List.Item key={result.id}>
                      <SearchResultLink result={result}>
                        <SearchResultContent result={result} t={t} />
                      </SearchResultLink>
                    </List.Item>
                  ))}
                </List.Root>
              )}
            </VStack>
          );
        })}
      </VStack>
    </Container>
  );
}
