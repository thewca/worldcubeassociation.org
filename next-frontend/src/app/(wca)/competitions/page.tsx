"use client";

import {
  Container,
  VStack,
  Button,
  Table,
  Text,
  Card,
  HStack,
  Slider,
  Input,
  CloseButton,
  InputGroup,
  SimpleGrid,
  Field,
  ButtonGroup,
  Tabs,
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
import {
  competitionFilterReducer,
  createFilterState,
} from "@/lib/wca/competitions/filterUtils";
import { createSearchParams } from "@/lib/wca/competitions/queryUtils";
import useAPI from "@/lib/wca/useAPI";
import EventSelector from "@/components/EventSelector";
import useDebounce from "@/lib/hooks/useDebounce";
import { WCA_API_PAGINATION } from "@/lib/wca/data/wca";
import Loading from "@/components/ui/loading";
import { useSearchParams } from "next/navigation";
import { useOnInView } from "react-intersection-observer";
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

  const { t } = useT();

  const canViewAdminDetails = false;

  const debouncedFilterState = useDebounce(filterState, DEBOUNCE_MS);

  const querySearchParams = createSearchParams(
    debouncedFilterState,
    canViewAdminDetails,
  );

  const {
    data: rawCompetitionData,
    fetchNextPage: competitionsFetchNextPage,
    isFetching: competitionsIsFetching,
    hasNextPage: hasMoreCompsToLoad,
  } = api.useInfiniteQuery(
    "get",
    "/v0/competition_index",
    {
      params: { query: Object.fromEntries(querySearchParams.entries()) },
    },
    {
      pageParamName: "page",
      getNextPageParam: (previousPage, allPages) => {
        // Continue until less than a full page of data is fetched,
        // which indicates the very last page.
        if (previousPage.length < WCA_API_PAGINATION) {
          return undefined;
        }
        return allPages.length + 1;
      },
      initialPageParam: 1,
    },
  );

  const bottomRef = useOnInView(() => {
    if (hasMoreCompsToLoad && !competitionsIsFetching) {
      competitionsFetchNextPage();
    }
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

    const flatPages = rawCompetitionData.pages.flatMap((page) => page);

    if (location === null || distanceFilter === 100) return flatPages;

    return flatPages.filter(
      (competition) =>
        getDistanceInKm(location, {
          longitude: competition.longitude_degrees,
          latitude: competition.latitude_degrees,
        }) <= distanceFilter,
    );
  }, [location, distanceFilter, rawCompetitionData]);

  if (!competitionsDistanceFiltered) {
    return "Error";
  }

  return (
    <Container>
      <VStack gap="8" width="full" pt="8">
        {!session.data?.user && (
          <RemovableCard
            imageUrl="newcomer.png"
            heading="Why Compete?"
            description="This section will only be visible to new visitors..."
            buttonText="Learn More"
            buttonUrl="/"
          />
        )}
        <Card.Root size="md">
          <Tabs.Root variant="subtle" colorPalette="blue" defaultValue="list">
            <Card.Header asChild>
              <HStack justify="space-between">
                <Card.Title>
                  <HStack gap={3}>
                    <AllCompsIcon fontSize="5xl" marginTop="-2" />
                    <Text textStyle="h1">All Competitions</Text>
                  </HStack>
                </Card.Title>
                <Tabs.List>
                  <Tabs.Trigger value="list">
                    <ListIcon />
                    List
                  </Tabs.Trigger>
                  <Tabs.Trigger value="map">
                    <MapIcon />
                    Map
                  </Tabs.Trigger>
                </Tabs.List>
              </HStack>
            </Card.Header>
            <Card.Body asChild>
              <VStack gap="2" borderBottom="black">
                <EventSelector
                  selectedEvents={filterState.selectedEvents}
                  title="Event"
                  onEventClick={(eventId) =>
                    dispatchFilter({ type: "toggle_event", eventId })
                  }
                  onClearClick={() => dispatchFilter({ type: "clear_events" })}
                  onAllClick={() =>
                    dispatchFilter({ type: "select_all_events" })
                  }
                />
                <SimpleGrid gap="2" width="full" columns={2}>
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
                  <Field.Root>
                    <Field.Label>Name</Field.Label>
                    <InputGroup
                      endElement={
                        <CloseButton
                          size="xs"
                          onClick={() => {
                            dispatchFilter({
                              type: "set_search",
                              search: "",
                            });
                          }}
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
                  </Field.Root>
                </SimpleGrid>
                <HStack gap="2" width="full" justify="space-between">
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
                  <ButtonGroup variant="outline">
                    {/* TODO: replace these buttons with DatePicker (Chakra does not have one by default) */}
                    <Button>
                      <CompRegoOpenDateIcon />
                      Date From
                    </Button>
                    <Button>
                      <CompRegoCloseDateIcon />
                      Date To
                    </Button>
                  </ButtonGroup>
                  {/* TODO: add "accordion" functionality to this button */}
                  <Button variant="outline" size="sm">
                    Advanced Filters
                  </Button>
                </HStack>
              </VStack>
            </Card.Body>
            <Card.Body>
              <Tabs.Content value="list">
                <HStack justify="space-between">
                  <HStack>
                    <Text>Registration Key:</Text>
                    <CompRegoFullButOpenOrangeIcon />
                    <Text>Full</Text>
                    <CompRegoNotFullOpenGreenIcon />
                    <Text>Open</Text>
                    <CompRegoNotOpenYetGreyIcon />
                    <Text>Not Open</Text>
                    <CompRegoClosedRedIcon />
                    <Text>Closed</Text>
                  </HStack>
                  <Text>
                    Currently Displaying: {competitionsDistanceFiltered.length}{" "}
                    competitions
                  </Text>
                </HStack>
                <CompetitionTable
                  competitions={competitionsDistanceFiltered}
                  isLoading={competitionsIsFetching}
                  hasMoreCompsToLoad={hasMoreCompsToLoad}
                  bottomRef={bottomRef}
                  t={t}
                />
              </Tabs.Content>
              <Tabs.Content value="map">TBD</Tabs.Content>
            </Card.Body>
          </Tabs.Root>
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
    <Table.Root size="xs" variant="competitions" borderWidth="2px">
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
