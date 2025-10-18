"use client";

import {
  Container,
  VStack,
  Heading,
  Flex,
  Button,
  Text,
  Table,
  Card,
  HStack,
  SegmentGroup,
  Slider,
  Box,
  Input,
  CloseButton,
  InputGroup,
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
import { components } from "@/types/openapi";
import { getDistanceInKm } from "@/lib/math/geolocation";
import type { GeoCoordinates } from "@/lib/types/geolocation";

const DEBOUNCE_MS = 600;

export default function CompetitionsPage() {
  const session = useSession();
  const [location, setLocation] = useState<GeoCoordinates | null>(null);
  const [distanceFilter, setDistanceFilter] = useState<number>(100);

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
          getDistanceInKm(location, {
            longitude: competition.longitude_degrees,
            latitude: competition.latitude_degrees,
          }) <= distanceFilter,
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
                  <HStack gap="2" width="full" alignItems="flex-start">
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
                  </HStack>
                  <HStack>
                    <Box flex={1}>
                      <RegionSelector
                        t={t}
                        label={t("activerecord.attributes.user.region")}
                        region={filterState.region}
                        onRegionChange={(region) =>
                          dispatchFilter({
                            type: "set_region",
                            region,
                          })
                        }
                      />
                    </Box>
                    <InputGroup
                      flex={1}
                      endElement={
                        <CloseButton
                          size="xs"
                          onClick={() => {
                            dispatchFilter({
                              type: "set_search",
                              search: "",
                            });
                          }}
                          me="-2"
                        />
                      }
                    >
                      <Input
                        placeholder="Search"
                        value={filterState.search}
                        onChange={(e) => {
                          dispatchFilter({
                            type: "set_search",
                            search: e.target.value,
                          });
                        }}
                      />
                    </InputGroup>
                  </HStack>
                  <HStack gap="2" width="full" alignItems="flex-start">
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
                  </HStack>
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
              <CompetitionTable
                competitions={competitionsDistanceFiltered}
                isLoading={competitionsIsFetching}
                hasMoreCompsToLoad={hasMoreCompsToLoad}
                bottomRef={bottomRef}
                t={t}
              />
            </VStack>
          </Card.Body>
        </Card.Root>
      </VStack>
    </Container>
  );
}

function CompetitionTable({
  competitions,
  isLoading,
  hasMoreCompsToLoad,
  bottomRef,
  t,
}: {
  competitions: components["schemas"]["CompetitionIndex"][];
  isLoading: boolean;
  hasMoreCompsToLoad: boolean;
  t: TFunction;
  bottomRef: (node?: Element | null) => void;
}) {
  return (
    <Table.Root size="xs" striped rounded="md" colorPalette="blue" variant="competitions">
      <Table.Body>
        {competitions.map((comp) => (
          <CompetitionTableEntry comp={comp} key={comp.id} />
        ))}
        <ListViewFooter
          isLoading={isLoading}
          hasMoreCompsToLoad={hasMoreCompsToLoad}
          numCompetitions={competitions.length}
          bottomRef={bottomRef}
          t={t}
        />
      </Table.Body>
    </Table.Root>
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
  if (isLoading) {
    return (
      <Table.Row textAlign="center">
        <Table.Cell colSpan={6}>
          <Loading />
        </Table.Cell>
      </Table.Row>
    );
  }

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
