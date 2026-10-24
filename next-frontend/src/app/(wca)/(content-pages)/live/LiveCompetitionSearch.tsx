"use client";

import { useState } from "react";
import {
  Combobox,
  HStack,
  Portal,
  Spinner,
  createListCollection,
} from "@chakra-ui/react";
import { LuSearch } from "react-icons/lu";
import { useRouter } from "next/navigation";
import { route } from "nextjs-routes";
import useDebounce from "@/lib/hooks/useDebounce";
import useAPI from "@/lib/wca/useAPI";
import { useT } from "@/lib/i18n/useI18n";
import WcaFlag from "@/components/WcaFlag";
import { components } from "@/types/openapi";

const DEBOUNCE_MS = 300;
const MAX_RESULTS = 10;

type CompetitionIndex = components["schemas"]["CompetitionIndex"];

export default function LiveCompetitionSearch() {
  const { t } = useT();
  const api = useAPI();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, DEBOUNCE_MS);
  const hasQuery = debouncedQuery.length > 0;

  const { data: competitions = [], isFetching } = api.useQuery(
    "get",
    "/v0/competition_index",
    {
      params: {
        query: {
          q: debouncedQuery,
          scoretaking_software: "internal",
          sort: "-start_date",
          per_page: MAX_RESULTS,
        },
      },
    },
    { enabled: hasQuery },
  );

  const visibleCompetitions = hasQuery ? competitions : [];

  const collection = createListCollection<CompetitionIndex>({
    items: visibleCompetitions,
    itemToValue: (competition) => competition.id,
    itemToString: (competition) => competition.name,
  });

  const openLiveResults = (competitionId: string) =>
    router.push(
      route({
        pathname: "/competitions/[competitionId]/live",
        query: { competitionId },
      }),
    );

  return (
    <Combobox.Root
      collection={collection}
      value={[]}
      onInputValueChange={(e) => setQuery(e.inputValue)}
      onValueChange={(e) => openLiveResults(e.value[0])}
      selectionBehavior="clear"
      width={{ base: "full", md: "xs" }}
      placeholder={t("competitions.live.overview.search")}
    >
      <Combobox.Control>
        {/* iOS Safari zooms the whole page when a focused input is under 16px. */}
        <Combobox.Input fontSize="md" />
        <Combobox.IndicatorGroup>
          {isFetching ? <Spinner size="xs" /> : <LuSearch />}
        </Combobox.IndicatorGroup>
      </Combobox.Control>
      <Portal>
        <Combobox.Positioner>
          <Combobox.Content>
            {visibleCompetitions.map((competition) => (
              <Combobox.Item item={competition} key={competition.id}>
                <HStack gap="2">
                  <WcaFlag code={competition.country_iso2} flexShrink="0" />
                  {competition.name}
                </HStack>
              </Combobox.Item>
            ))}
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
  );
}
