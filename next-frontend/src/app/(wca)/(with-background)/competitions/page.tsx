"use client";

import {
  Container,
  VStack,
  Button,
  Table,
  Text,
  Card,
  DatePicker,
  HStack,
  parseDate,
  Portal,
  Slider,
  Input,
  CloseButton,
  InputGroup,
  SimpleGrid,
  Field,
  Tabs,
  IconButton,
  ClientOnly,
  Icon,
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
import { ReactNode, useReducer, useState } from "react";
import {
  competitionFilterReducer,
  createFilterState,
} from "@/lib/wca/competitions/filterUtils";
import { createSearchParams } from "@/lib/wca/competitions/queryUtils";
import useAPI from "@/lib/wca/useAPI";
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
import { FormEventSelector } from "@/components/EventSelector";
import { LuMapPin, LuSettings2 } from "react-icons/lu";
import BetaDisabledTooltip from "@/components/BetaDisabledTooltip";

const DEBOUNCE_MS = 600;

// Selectable radii for the "within X of me" filter, in kilometres. The slider is indexed
// into this list, and the index one past the end means "don't filter by distance at all".
const DISTANCE_FILTER_KM = [50, 100, 250, 500];
const NO_DISTANCE_FILTER = DISTANCE_FILTER_KM.length;

export default function CompetitionsPage() {
  const session = useSession();
  const [location, setLocation] = useState<GeoCoordinates>();
  const [distanceFilterIndex, setDistanceFilterIndex] =
    useState<number>(NO_DISTANCE_FILTER);

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
      params: { query: querySearchParams },
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

  const geolocationSupported =
    typeof navigator !== "undefined" && "geolocation" in navigator;

  const requestGeolocationPermission = () => {
    return navigator.geolocation.getCurrentPosition((position) => {
      setLocation(position.coords);
    });
  };

  const distanceMarks = [
    ...DISTANCE_FILTER_KM.map((km, index) => ({
      value: index,
      label: km.toString(),
    })),
    { value: NO_DISTANCE_FILTER, label: t("competitions.index.distance_any") },
  ];

  const loadedCompetitions =
    rawCompetitionData?.pages.flatMap((page) => page) ?? [];

  const maxDistanceKm = DISTANCE_FILTER_KM[distanceFilterIndex];

  const competitionsDistanceFiltered =
    location === undefined || maxDistanceKm === undefined
      ? loadedCompetitions
      : loadedCompetitions.filter(
          (competition) =>
            getDistanceInKm(location, {
              longitude: competition.longitude_degrees,
              latitude: competition.latitude_degrees,
            }) <= maxDistanceKm,
        );

  return (
    <Container>
      <VStack gap="8" width="full" pt="8">
        <ClientOnly>
          {session.status === "unauthenticated" && (
            <RemovableCard
              imageUrl="newcomer.png"
              heading="Why Compete?"
              description="This section will only be visible to new visitors..."
              buttonText="Learn More"
              buttonUrl="/"
            />
          )}
        </ClientOnly>
        <Card.Root size="md">
          <Tabs.Root variant="subtle" colorPalette="blue" defaultValue="list">
            <Card.Header asChild>
              <HStack justify="space-between">
                <Card.Title>
                  <HStack gap={3}>
                    <AllCompsIcon fontSize="5xl" marginTop="-2" />
                    <Text textStyle="h1">
                      {t("competitions.index.all_competitions")}
                    </Text>
                  </HStack>
                </Card.Title>
                <Tabs.List>
                  <Tabs.Trigger value="list">
                    <ListIcon />
                    {t("competitions.index.list")}
                  </Tabs.Trigger>
                  <BetaDisabledTooltip>
                    <Tabs.Trigger value="map" disabled>
                      <MapIcon />
                      {t("competitions.index.map")}
                    </Tabs.Trigger>
                  </BetaDisabledTooltip>
                </Tabs.List>
              </HStack>
            </Card.Header>
            <Card.Body asChild>
              <VStack gap="3" borderBottom="black">
                <FormEventSelector
                  selectedEvents={filterState.selectedEvents}
                  title={t("competitions.index.event")}
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
                    <Field.Label>{t("competitions.index.name")}</Field.Label>
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
                        placeholder={t("competitions.index.search")}
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
                    value={[distanceFilterIndex]}
                    onValueChange={(e) => setDistanceFilterIndex(e.value[0])}
                    min={0}
                    max={NO_DISTANCE_FILTER}
                    step={1}
                    disabled={location === undefined}
                  >
                    <Slider.Label asChild>
                      <HStack justifyContent="space-between">
                        {t("competitions.index.distance")}
                        <ClientOnly>
                          {geolocationSupported && location === undefined && (
                            <IconButton
                              size="xs"
                              variant="outline"
                              colorPalette="blue"
                              onClick={() => requestGeolocationPermission()}
                            >
                              <LuMapPin />
                            </IconButton>
                          )}
                        </ClientOnly>
                      </HStack>
                    </Slider.Label>
                    <Slider.Control>
                      <Slider.Track>
                        <Slider.Range />
                      </Slider.Track>
                      <Slider.Thumbs />
                      <Slider.Marks marks={distanceMarks} />
                    </Slider.Control>
                  </Slider.Root>
                  <HStack gap="2">
                    <DateFilter
                      label={t("competitions.index.from_date")}
                      icon={<CompRegoOpenDateIcon />}
                      isoDate={filterState.customStartDate}
                      max={filterState.customEndDate}
                      onDateChange={(customStartDate) =>
                        dispatchFilter({
                          type: "set_custom_start_date",
                          customStartDate,
                        })
                      }
                    />
                    <DateFilter
                      label={t("competitions.index.to_date")}
                      icon={<CompRegoCloseDateIcon />}
                      isoDate={filterState.customEndDate}
                      min={filterState.customStartDate}
                      onDateChange={(customEndDate) =>
                        dispatchFilter({
                          type: "set_custom_end_date",
                          customEndDate,
                        })
                      }
                    />
                  </HStack>
                  {/* TODO: add "accordion" functionality to this button */}
                  <BetaDisabledTooltip>
                    <Button variant="outline" disabled>
                      <Icon>
                        <LuSettings2 />
                      </Icon>{" "}
                      {t("competitions.index.advanced_filters")}
                    </Button>
                  </BetaDisabledTooltip>
                </HStack>
              </VStack>
            </Card.Body>
            <Card.Body>
              <Tabs.Content value="list">
                <HStack justify="space-between">
                  <HStack>
                    <Text>{t("competitions.index.registration_key")}</Text>
                    <CompRegoFullButOpenOrangeIcon />
                    <Text>
                      {t("competitions.index.registration_status.full")}
                    </Text>
                    <CompRegoNotFullOpenGreenIcon />
                    <Text>
                      {t("competitions.index.registration_status.open")}
                    </Text>
                    <CompRegoNotOpenYetGreyIcon />
                    <Text>
                      {t("competitions.index.registration_status.not_open")}
                    </Text>
                    <CompRegoClosedRedIcon />
                    <Text>
                      {t("competitions.index.registration_status.closed")}
                    </Text>
                  </HStack>
                  <Text>
                    {t("competitions.index.currently_displaying", {
                      count: competitionsDistanceFiltered.length,
                    })}
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

function DateFilter({
  label,
  icon,
  isoDate,
  onDateChange,
  min,
  max,
}: {
  label: string;
  icon: ReactNode;
  isoDate: string | null;
  onDateChange: (isoDate: string | null) => void;
  min?: string | null;
  max?: string | null;
}) {
  return (
    <DatePicker.Root
      width="3xs"
      colorPalette="blue"
      positioning={{ sameWidth: false }}
      value={isoDate ? [parseDate(isoDate)] : []}
      min={min ? parseDate(min) : undefined}
      max={max ? parseDate(max) : undefined}
      // `valueAsString` is localised for display; the DateValue stringifies to ISO 8601.
      onValueChange={(details) =>
        onDateChange(details.value[0]?.toString() ?? null)
      }
    >
      <DatePicker.Label>{label}</DatePicker.Label>
      <DatePicker.Control>
        <DatePicker.Input />
        <DatePicker.IndicatorGroup>
          <DatePicker.ClearTrigger />
          <DatePicker.Trigger>{icon}</DatePicker.Trigger>
        </DatePicker.IndicatorGroup>
      </DatePicker.Control>
      <Portal>
        <DatePicker.Positioner>
          <DatePicker.Content>
            <DatePicker.View view="day">
              <DatePicker.Header />
              <DatePicker.DayTable />
            </DatePicker.View>
            <DatePicker.View view="month">
              <DatePicker.Header />
              <DatePicker.MonthTable />
            </DatePicker.View>
            <DatePicker.View view="year">
              <DatePicker.Header />
              <DatePicker.YearTable />
            </DatePicker.View>
          </DatePicker.Content>
        </DatePicker.Positioner>
      </Portal>
    </DatePicker.Root>
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
