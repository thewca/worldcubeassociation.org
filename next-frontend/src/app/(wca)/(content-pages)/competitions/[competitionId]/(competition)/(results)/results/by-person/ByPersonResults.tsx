"use client";

import CountryMap from "@/components/CountryMap";
import { ByPersonTable } from "@/components/results/ResultsTable";
import WcaFlag from "@/components/WcaFlag";
import {
  Accordion,
  Avatar,
  Card,
  Heading,
  HStack,
  VStack,
  Link as ChakraLink,
  Box,
  Stack,
  Input,
  InputGroup,
  Field,
  Text,
  Select,
  For,
  createListCollection,
  CloseButton,
} from "@chakra-ui/react";
import Link from "next/link";
import { route } from "nextjs-routes";
import _ from "lodash";
import { CompetitionResultRow } from "@/lib/wca/results/competitionResults";
import { useT } from "@/lib/i18n/useI18n";
import useIsScrolled from "@/lib/hooks/useIsScrolled";
import BackToTopButton from "@/components/BackToTopButton";
import { LuSearch } from "react-icons/lu";
import { useRef, useState } from "react";
import useDebounce from "@/lib/hooks/useDebounce";
import { TFunction } from "i18next";

interface ByPersonResultsProps {
  resultsByPerson: _.Dictionary<CompetitionResultRow[]>;
  sessionWcaId?: string | null;
  countries: string[];
}

type FiltersType = {
  name: string;
  country: string;
};

const DEBOUNCE_MS = 500;

export default function ByPersonResults({
  resultsByPerson,
  sessionWcaId,
  countries,
}: ByPersonResultsProps) {
  const [filters, setFilters] = useState<FiltersType>({
    name: "",
    country: "",
  });

  const changeFilters = (key: keyof FiltersType, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const { t } = useT();
  const { isScrolledDown, topSentinelRef } = useIsScrolled();
  const debouncedQuery = useDebounce(filters.name, DEBOUNCE_MS);

  const nameFilter = debouncedQuery.toLowerCase();
  const countryFilter = filters.country.toLowerCase();

  const filteredResults = _.pickBy(
    _.mapValues(resultsByPerson, (results) =>
      results.filter(
        (result) =>
          (result.name.toLowerCase().includes(nameFilter) ||
            result.wca_id.toLowerCase().includes(nameFilter)) &&
          result.country_iso2.toLowerCase().includes(countryFilter),
      ),
    ),
    (results) => results.length > 0,
  );

  return (
    <Card.Root>
      <Card.Body>
        <Filters
          filters={filters}
          changeFilters={changeFilters}
          countries={countries}
          t={t}
        />

        <Box ref={topSentinelRef} position="absolute" />

        <ResultsList
          filteredResults={filteredResults}
          sessionWcaId={sessionWcaId}
        />
      </Card.Body>
      <BackToTopButton visible={isScrolledDown} />
    </Card.Root>
  );
}

function ResultsList({
  filteredResults,
  sessionWcaId,
}: {
  filteredResults: _.Dictionary<CompetitionResultRow[]>;
  sessionWcaId?: string | null;
}) {
  const { t } = useT();

  if (_.isEmpty(filteredResults))
    return (
      <Text width="full" textAlign="center">
        {t("competitions.results.no_results")}
      </Text>
    );

  return (
    <Accordion.Root
      defaultValue={sessionWcaId ? [sessionWcaId] : undefined}
      multiple
      variant="enclosed"
    >
      {_.map(filteredResults, (results, wcaId) => (
        <Accordion.Item key={wcaId} value={wcaId}>
          <Accordion.ItemTrigger justifyContent="space-between">
            <Heading size="2xl" asChild>
              <HStack gap="4">
                <Avatar.Root>
                  <Avatar.Fallback name={results[0].name} />
                  {/* Currently we don't have the actual image URL in the API output, this is pending a bigger refactor */}
                </Avatar.Root>
                <VStack width="fit-content" alignItems="start" gap="0.5">
                  <ChakraLink textStyle="headerLink" asChild>
                    <Link
                      href={route({
                        pathname: "/persons/[wcaId]",
                        query: { wcaId },
                      })}
                    >
                      {results[0].name}
                    </Link>
                  </ChakraLink>
                  <PersonCountry country_iso2={results[0].country_iso2} t={t} />
                </VStack>
              </HStack>
            </Heading>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Accordion.ItemBody>
              <ByPersonTable
                results={results}
                isAdmin={false}
                t={t}
                solveTextAlign="center"
              />
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

function Filters({
  filters,
  changeFilters,
  countries,
  t,
}: {
  filters: FiltersType;
  changeFilters: (key: keyof FiltersType, value: string) => void;
  countries: string[];
  t: TFunction;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectValues = [
    { value: "", label: "All countries" },
    ...countries.map((c) => ({
      value: c,
      label: (
        <CountryMap code={c} t={t} textStyle="bodyEmphasis" color="fg.muted" />
      ),
    })),
  ];
  const collection = createListCollection({ items: selectValues });

  const endElement = filters.name ? (
    <CloseButton
      size="xs"
      onClick={() => {
        changeFilters("name", "");
        inputRef.current?.focus();
      }}
      me="-2"
    />
  ) : undefined;

  return (
    <Stack direction={{ base: "column", md: "row" }}>
      <Field.Root>
        <Field.Label>{t("competitions.results.query_search")}</Field.Label>
        <InputGroup startElement={<LuSearch />} endElement={endElement}>
          <Input
            variant="outline"
            value={filters.name}
            ref={inputRef}
            onChange={(e) => changeFilters("name", e.target.value)}
          />
        </InputGroup>
      </Field.Root>

      <Select.Root
        collection={collection}
        value={[filters.country]}
        onValueChange={(v) => changeFilters("country", v.value[0])}
        variant="outline"
      >
        <Select.HiddenSelect />
        <Select.Label>{t("competitions.results.country_search")}</Select.Label>

        <Select.Control>
          <Select.Trigger>
            <Select.ValueText>
              <SelectValue country={filters.country} t={t} />
            </Select.ValueText>
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>

        <Select.Positioner>
          <Select.Content>
            <For each={selectValues}>
              {(country) => (
                <Select.Item item={country.value} key={country.value}>
                  <SelectValue country={country.value} t={t} />
                </Select.Item>
              )}
            </For>
          </Select.Content>
        </Select.Positioner>
      </Select.Root>
    </Stack>
  );
}

function PersonCountry({
  country_iso2,
  t,
}: {
  country_iso2: string;
  t: TFunction;
}) {
  return (
    <HStack>
      <WcaFlag code={country_iso2} size="sm" />
      <CountryMap
        code={country_iso2}
        t={t}
        textStyle="bodyEmphasis"
        color="fg.muted"
      />
    </HStack>
  );
}

function SelectValue({ country, t }: { country: string; t: TFunction }) {
  if (country) return <PersonCountry country_iso2={country} t={t} />;
  return <Text>{t("competitions.results.all_countries")}</Text>;
}
