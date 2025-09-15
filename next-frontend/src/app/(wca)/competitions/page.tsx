"use client";

import {
  useFilter,
  useListCollection,
  Container,
  VStack,
  Heading,
  Flex,
  Button,
  Text,
  Combobox,
  Portal,
  Table,
  Card,
  HStack,
  SegmentGroup,
  Slider,
  Box,
} from "@chakra-ui/react";
import { AllCompsIcon } from "@/components/icons/AllCompsIcon";
import MapIcon from "@/components/icons/MapIcon";
import ListIcon from "@/components/icons/ListIcon";
import CompetitionTableEntry from "@/components/CompetitionTableEntry";
import RemovableCard from "@/components/RemovableCard";
import CompRegoFullButOpenOrangeIcon from "@/components/icons/CompRegoFullButOpen_orangeIcon";
import CompRegoNotFullOpenGreenIcon from "@/components/icons/CompRegoNotFullOpen_greenIcon";
import CompRegoNotOpenYetGreyIcon from "@/components/icons/CompRegoNotOpenYet_greyIcon";
import CompRegoClosedRedIcon from "@/components/icons/CompRegoClosed_redIcon";
import CompRegoOpenDateIcon from "@/components/icons/CompRegoOpenDateIcon";
import CompRegoCloseDateIcon from "@/components/icons/CompRegoCloseDateIcon";
import Flag from "react-world-flags";

import countries from "@/lib/wca/data/countries";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useReducer, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  competitionFilterReducer,
  createFilterState,
} from "@/lib/wca/competitions/filterUtils";
import {
  calculateQueryKey,
  createSearchParams,
} from "@/lib/wca/competitions/queryUtils";
import useAPI from "@/lib/wca/useAPI";
import EventSelector from "@/components/EventSelector";
import useDebounce from "@/lib/hooks/useDebounce";
import { WCA_API_PAGINATION } from "@/lib/wca/data/wca";
import Loading from "@/components/ui/loading";
import { useSearchParams } from "next/navigation";
import { useInView } from "react-intersection-observer";
import { TFunction } from "i18next";
import { useT } from "@/lib/i18n/useI18n";
import RegionSelector from "@/components/RegionSelector";

const DEBOUNCE_MS = 600;

// Haversine formula to compute distance between two lat/lng pairs
function getDistanceFromLatLonInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371; // Earth's radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export default function CompetitionsPage() {
  const session = useSession();
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [distanceFilter, setDistanceFilter] = useState<number>(100);

  const { contains } = useFilter({ sensitivity: "base" });

  const { collection, filter } = useListCollection({
    initialItems: Object.entries(countries.byIso2).map(([code, country]) => ({
      label: country.id,
      value: code,
    })),
    filter: contains,
  });

  const api = useAPI();

  const searchParams = useSearchParams();

  const [filterState, dispatchFilter] = useReducer(
    competitionFilterReducer,
    searchParams,
    createFilterState,
  );

  const { ref: bottomRef, inView: bottomInView } = useInView();

  const { t } = useT();

  const canViewAdminDetails = false;

  const debouncedFilterState = useDebounce(filterState, DEBOUNCE_MS);

  const competitionQueryKey = useMemo(
    () => calculateQueryKey(debouncedFilterState, canViewAdminDetails),
    [debouncedFilterState, canViewAdminDetails],
  );

  const {
    data: rawCompetitionData,
    fetchNextPage: competitionsFetchNextPage,
    isFetching: competitionsIsFetching,
    hasNextPage: hasMoreCompsToLoad,
  } = useInfiniteQuery({
    // We do have the deps covered in competitionQueryKey
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ["competitions", competitionQueryKey],
    queryFn: ({ pageParam }) => {
      const querySearchParams = createSearchParams(
        debouncedFilterState,
        pageParam.toString(),
        canViewAdminDetails,
      );

      return api.GET("/v0/competition_index", {
        params: { query: Object.fromEntries(querySearchParams.entries()) },
      });
    },
    getNextPageParam: (previousPage, allPages) => {
      // Continue until less than a full page of data is fetched,
      // which indicates the very last page.
      if (previousPage.data!.length < WCA_API_PAGINATION) {
        return undefined;
      }
      return allPages.length + 1;
    },
    initialPageParam: 1,
  });

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation(position.coords);
      });
    }
  });

  const marks = [
    { value: 0, label: "closest" },
    { value: 25, label: "close" },
    { value: 50, label: "far" },
    { value: 75, label: "furthest" },
    { value: 100, label: "all" },
  ];

  const competitionsDistanceFiltered = useMemo(() => {
    if (!rawCompetitionData) return [];
    if (location === null || distanceFilter === 100)
      return rawCompetitionData!.pages.flatMap(({ data }) => data!);
    return rawCompetitionData!.pages
      .flatMap(({ data }) => data!)
      .filter(
        (competition) =>
          getDistanceFromLatLonInKm(
            location.latitude,
            location.latitude,
            competition.longitude_degrees,
            competition.latitude_degrees,
          ) <= distanceFilter,
      );
  }, [location, distanceFilter, rawCompetitionData]);

  useEffect(() => {
    if (hasMoreCompsToLoad && bottomInView && !competitionsIsFetching) {
      competitionsFetchNextPage();
    }
  }, [
    hasMoreCompsToLoad,
    bottomInView,
    competitionsFetchNextPage,
    competitionsIsFetching,
  ]);

  if (competitionsIsFetching) {
    return <Loading />;
  }

  if (!competitionsDistanceFiltered) {
    return "Error";
  }

  return (
    <Container>
      <VStack gap="8" width="full" pt="8" alignItems="left">
        {!session.data?.user && (
          <RemovableCard
            imageUrl="newcomer.png"
            heading="Why Compete?"
            description="This section will only be visible to new visitors..."
            buttonText="Learn More"
            buttonUrl="/"
          />
        )}
        <Card.Root variant="hero" size="md" overflow="hidden">
          <Card.Body bg="bg">
            <VStack gap="8" width="full" alignItems="left">
              <Heading size="5xl">
                <AllCompsIcon boxSize="1em" /> All Competitions
              </Heading>
              <Flex gap="2" width="full" alignItems="flex-start">
                <Flex gap="2" width="full" flexDirection="column">
                  <Flex gap="2" width="full" alignItems="flex-start">
                    <Combobox.Root
                      collection={collection}
                      onInputValueChange={(e) => filter(e.inputValue)}
                      width="320px"
                      colorPalette="blue"
                      openOnClick
                    >
                      <RegionSelector
                        t={t}
                        region={filterState.region}
                        label="Country/Continent"
                        onRegionChange={(region) =>
                          dispatchFilter({
                            type: "set_region",
                            region: countries.byId[region].iso2,
                          })
                        }
                      />
                      <Portal>
                        <Combobox.Positioner>
                          <Combobox.Content justifyContent="flex-start">
                            <Combobox.Empty>No items found</Combobox.Empty>
                            {collection.items.map((item) => (
                              <Combobox.Item item={item} key={item.value}>
                                <Flag
                                  code={item.value}
                                  fallback={item.value}
                                  height="25"
                                  width="32"
                                />
                                {item.label}
                                <Combobox.ItemIndicator />
                              </Combobox.Item>
                            ))}
                          </Combobox.Content>
                        </Combobox.Positioner>
                      </Portal>
                    </Combobox.Root>
                    {/* TODO: replace these buttons with DatePicker (Chakra does not have one by default) */}
                    <Button variant="outline">
                      <CompRegoOpenDateIcon />
                      Date From
                    </Button>
                    <Button variant="outline">
                      <CompRegoCloseDateIcon />
                      Date To
                    </Button>
                    {/* TODO: add "accordion" functionality to this button */}
                    <Button variant="outline" size="sm">
                      Advanced Filters
                    </Button>
                  </Flex>

                  <Flex gap="2" width="full" alignItems="flex-start">
                    <Slider.Root
                      width="250px"
                      colorPalette="blue"
                      value={[distanceFilter]}
                      onValueChange={(e) => setDistanceFilter(e.value[0])}
                      step={25}
                      disabled={location === null}
                    >
                      <Slider.Label>Distance</Slider.Label>
                      <Slider.Control>
                        <Slider.Track>
                          <Slider.Range />
                        </Slider.Track>
                        <Slider.Thumbs />
                        <Slider.Marks marks={marks} />
                      </Slider.Control>
                    </Slider.Root>

                    <EventSelector
                      selectedEvents={filterState.selectedEvents}
                      title="Event"
                      onEventClick={(eventId) =>
                        dispatchFilter({ type: "toggle_event", eventId })
                      }
                      onClearClick={() =>
                        dispatchFilter({ type: "clear_events" })
                      }
                      onAllClick={() =>
                        dispatchFilter({ type: "select_all_events" })
                      }
                    />
                  </Flex>
                </Flex>

                <Flex gap="2" ml="auto">
                  <SegmentGroup.Root
                    defaultValue="list"
                    size="lg"
                    colorPalette="blue"
                    variant="inset"
                  >
                    <SegmentGroup.Indicator />
                    <SegmentGroup.Items
                      items={[
                        {
                          value: "list",
                          label: (
                            <HStack>
                              <ListIcon />
                              List
                            </HStack>
                          ),
                        },
                        {
                          value: "map",
                          label: (
                            <HStack>
                              <MapIcon />
                              Map
                            </HStack>
                          ),
                        },
                      ]}
                    />
                  </SegmentGroup.Root>
                </Flex>
              </Flex>
              <Flex gap="2" width="full">
                <Text>Registration Key:</Text>
                <CompRegoFullButOpenOrangeIcon />
                <Text>Full</Text>
                <CompRegoNotFullOpenGreenIcon />
                <Text>Open</Text>
                <CompRegoNotOpenYetGreyIcon />
                <Text>Not Open</Text>
                <CompRegoClosedRedIcon />
                <Text>Closed</Text>
                <Text ml="auto">
                  Currently Displaying: {competitionsDistanceFiltered.length}{" "}
                  competitions
                </Text>
              </Flex>
              <Card.Root
                bg="bg.inverted"
                color="fg.inverted"
                shadow="md"
                overflow="hidden"
                width="full"
              >
                <Card.Body p={0}>
                  <Table.Root size="xs" rounded="md" variant="competitions">
                    <Table.Body>
                      {competitionsDistanceFiltered.map((comp) => (
                        <CompetitionTableEntry comp={comp} key={comp.id} />
                      ))}
                    </Table.Body>
                    <ListViewFooter
                      isLoading={competitionsIsFetching}
                      hasMoreCompsToLoad={hasMoreCompsToLoad}
                      numCompetitions={competitionsDistanceFiltered.length}
                      bottomRef={bottomRef}
                      t={t}
                    />
                  </Table.Root>
                </Card.Body>
              </Card.Root>
            </VStack>
          </Card.Body>
        </Card.Root>
      </VStack>
    </Container>
  );
}

function ListViewFooter({
  isLoading,
  hasMoreCompsToLoad,
  numCompetitions,
  bottomRef,
  t,
}: {
  isLoading: boolean;
  hasMoreCompsToLoad: boolean;
  numCompetitions: number;
  bottomRef: (node?: Element | null) => void;
  t: TFunction;
}) {
  if (!isLoading && !hasMoreCompsToLoad) {
    return (
      numCompetitions > 0 && (
        <Table.Row textAlign="center">
          <Table.Cell colSpan={6}>
            {t("competitions.index.no_more_comps")}
          </Table.Cell>
        </Table.Row>
      )
    );
  }

  return <Table.Row ref={bottomRef} />;
}
