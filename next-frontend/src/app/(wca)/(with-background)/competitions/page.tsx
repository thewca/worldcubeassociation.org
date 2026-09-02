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
  Input,
  CloseButton,
  InputGroup,
  SimpleGrid,
  Field,
  Group,
  NumberInput,
  SegmentGroup,
  Tabs,
  IconButton,
  ClientOnly,
  Icon,
  Stack,
  Wrap,
  Badge,
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
import TabMap from "@/components/competitions/TabMap";
import { LuMapPin, LuSettings2 } from "react-icons/lu";
import BetaDisabledTooltip from "@/components/BetaDisabledTooltip";

const DEBOUNCE_MS = 600;

// Units offered by the "within X of me" filter. `toKm` converts a radius in that unit to the
// kilometres the distance calculation works in, and each unit carries its own default and step
// so that the two can be tuned independently.
const DISTANCE_UNITS = {
  km: { toKm: 1, defaultRadius: 100, step: 50 },
  mi: { toKm: 1.609344, defaultRadius: 100, step: 50 },
} as const;

type DistanceUnit = keyof typeof DISTANCE_UNITS;

const DEFAULT_DISTANCE_UNIT: DistanceUnit = "km";

const isDistanceUnit = (value: string | null): value is DistanceUnit =>
  value !== null && value in DISTANCE_UNITS;

// Decimal places shown for the resolved coordinates, roughly street-level precision.
const COORDINATE_PRECISION = 4;

export default function CompetitionsPage() {
  const session = useSession();
  const [location, setLocation] = useState<GeoCoordinates>();
  const [distanceUnit, setDistanceUnit] = useState(DEFAULT_DISTANCE_UNIT);
  // Held as a string because that is what NumberInput controls, and it lets the field go
  // empty while the competitor is typing.
  const [radius, setRadius] = useState(
    DISTANCE_UNITS[DEFAULT_DISTANCE_UNIT].defaultRadius.toString(),
  );

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

  // Switching unit falls back to that unit's default rather than converting, so that each
  // unit lands on a round number.
  const changeDistanceUnit = (value: string | null) => {
    if (!isDistanceUnit(value)) return;

    setDistanceUnit(value);
    setRadius(DISTANCE_UNITS[value].defaultRadius.toString());
  };

  const loadedCompetitions =
    rawCompetitionData?.pages.flatMap((page) => page) ?? [];

  // An empty or half-typed radius means "no limit yet" rather than "everything is too far away".
  const maxDistanceKm = Number(radius) * DISTANCE_UNITS[distanceUnit].toKm;
  const hasDistanceLimit = maxDistanceKm > 0;

  const competitionsDistanceFiltered =
    location !== undefined && hasDistanceLimit
      ? loadedCompetitions.filter(
          (competition) =>
            getDistanceInKm(location, {
              longitude: competition.longitude_degrees,
              latitude: competition.latitude_degrees,
            }) <= maxDistanceKm,
        )
      : loadedCompetitions;

  const loadedCompetitionCount =
    rawCompetitionData?.pages.reduce((total, page) => total + page.length, 0) ??
    0;

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
        <Card.Root size={{ base: "sm", md: "md" }} width="full">
          <Tabs.Root variant="subtle" colorPalette="blue" defaultValue="list">
            <Card.Header asChild>
              <Stack
                direction={{ base: "column", md: "row" }}
                justify="space-between"
                align={{ base: "stretch", md: "center" }}
              >
                <Card.Title>
                  <HStack gap={3}>
                    <AllCompsIcon
                      fontSize={{ base: "3xl", md: "5xl" }}
                      marginTop="-2"
                    />
                    <Text textStyle={{ base: "h3", md: "h1" }}>
                      {t("competitions.index.all_competitions")}
                    </Text>
                  </HStack>
                </Card.Title>
                <Tabs.List>
                  <Tabs.Trigger value="list">
                    <ListIcon />
                    {t("competitions.index.list")}
                  </Tabs.Trigger>
                  <Tabs.Trigger value="map">
                    <MapIcon />
                    {t("competitions.index.map")}
                  </Tabs.Trigger>
                </Tabs.List>
              </Stack>
            </Card.Header>
            <Card.Body asChild>
              <VStack gap="3" borderBottom="black">
                <FormEventSelector
                  wrap
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
                <SimpleGrid gap="2" width="full" columns={{ base: 1, md: 2 }}>
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
                <Stack
                  direction={{ base: "column", lg: "row" }}
                  gap="4"
                  width="full"
                  justify="space-between"
                  align={{ base: "stretch", lg: "flex-start" }}
                >
                  <LocationFilter
                    location={location}
                    geolocationSupported={geolocationSupported}
                    onLocateClick={requestGeolocationPermission}
                    radius={radius}
                    onRadiusChange={setRadius}
                    distanceUnit={distanceUnit}
                    onDistanceUnitChange={changeDistanceUnit}
                    t={t}
                  />
                  <Stack
                    direction={{ base: "column", md: "row" }}
                    gap="2"
                    width={{ base: "full", lg: "auto" }}
                  >
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
                  </Stack>
                  {/* TODO: add "accordion" functionality to this button */}
                  <BetaDisabledTooltip>
                    <Button
                      variant="outline"
                      disabled
                      width={{ base: "full", lg: "auto" }}
                    >
                      <Icon>
                        <LuSettings2 />
                      </Icon>{" "}
                      {t("competitions.index.advanced_filters")}
                    </Button>
                  </BetaDisabledTooltip>
                </Stack>
              </VStack>
            </Card.Body>
            <Card.Body>
              <Tabs.Content value="list">
                <Stack
                  direction={{ base: "column", lg: "row" }}
                  justify="space-between"
                  align={{ base: "start", lg: "center" }}
                >
                  <Wrap gapX="3" gapY="1" align="center">
                    <Text>{t("competitions.index.registration_key")}</Text>
                    <Badge size="md" variant="surface">
                      <CompRegoFullButOpenOrangeIcon />
                      {t("competitions.index.registration_status.full")}
                    </Badge>
                    <Badge size="md" variant="surface">
                      <CompRegoNotFullOpenGreenIcon />
                      {t("competitions.index.registration_status.open")}
                    </Badge>
                    <Badge size="md" variant="surface">
                      <CompRegoNotOpenYetGreyIcon />
                      {t("competitions.index.registration_status.not_open")}
                    </Badge>
                    <Badge size="md" variant="surface">
                      <CompRegoClosedRedIcon />
                      {t("competitions.index.registration_status.closed")}
                    </Badge>
                  </Wrap>
                  <Text>
                    {t("competitions.index.currently_displaying", {
                      count: competitionsDistanceFiltered.length,
                    })}
                  </Text>
                </Stack>
                <CompetitionTable
                  competitions={competitionsDistanceFiltered}
                  isLoading={competitionsIsFetching}
                  hasMoreCompsToLoad={hasMoreCompsToLoad}
                  bottomRef={bottomRef}
                  t={t}
                />
              </Tabs.Content>
              <Tabs.Content value="map">
                <TabMap
                  competitions={competitionsDistanceFiltered}
                  loadedCompetitionCount={loadedCompetitionCount}
                  isLoading={competitionsIsFetching}
                  fetchMoreCompetitions={competitionsFetchNextPage}
                  hasMoreCompsToLoad={hasMoreCompsToLoad}
                />
              </Tabs.Content>
            </Card.Body>
          </Tabs.Root>
        </Card.Root>
      </VStack>
    </Container>
  );
}

function LocationFilter({
  location,
  geolocationSupported,
  onLocateClick,
  radius,
  onRadiusChange,
  distanceUnit,
  onDistanceUnitChange,
  t,
}: {
  location: GeoCoordinates | undefined;
  geolocationSupported: boolean;
  onLocateClick: () => void;
  radius: string;
  onRadiusChange: (radius: string) => void;
  distanceUnit: DistanceUnit;
  onDistanceUnitChange: (distanceUnit: string | null) => void;
  t: TFunction;
}) {
  const { step } = DISTANCE_UNITS[distanceUnit];

  const formattedLocation = location
    ? `${location.latitude.toFixed(COORDINATE_PRECISION)}, ${location.longitude.toFixed(COORDINATE_PRECISION)}`
    : "";

  const distanceUnitItems = [
    { value: "km", label: t("competitions.index.distance_units.km") },
    { value: "mi", label: t("competitions.index.distance_units.mi") },
  ];

  return (
    <VStack gap="2" width={{ base: "full", md: "sm" }} align="stretch">
      <Field.Root>
        <Field.Label>{t("competitions.index.location")}</Field.Label>
        <Group attached width="full">
          {/* Typing an address needs a geocoder, which the beta does not have yet. */}
          <BetaDisabledTooltip>
            <Input
              disabled
              placeholder={t("competitions.index.location_placeholder")}
              value={formattedLocation}
            />
          </BetaDisabledTooltip>
          <ClientOnly>
            {geolocationSupported && (
              <IconButton
                variant="outline"
                colorPalette="blue"
                aria-label={t("competitions.index.use_my_location")}
                onClick={onLocateClick}
              >
                <LuMapPin />
              </IconButton>
            )}
          </ClientOnly>
        </Group>
      </Field.Root>
      <Field.Root>
        <Field.Label>{t("competitions.index.distance")}</Field.Label>
        <HStack gap="2" width="full">
          <NumberInput.Root
            width="full"
            value={radius}
            onValueChange={(e) => onRadiusChange(e.value)}
            min={step}
            step={step}
            disabled={location === undefined}
          >
            <Group attached width="full">
              <NumberInput.DecrementTrigger asChild>
                <Button variant="outline">−{step}</Button>
              </NumberInput.DecrementTrigger>
              <NumberInput.Input textAlign="center" />
              <NumberInput.IncrementTrigger asChild>
                <Button variant="outline">+{step}</Button>
              </NumberInput.IncrementTrigger>
            </Group>
          </NumberInput.Root>
          <SegmentGroup.Root
            value={distanceUnit}
            onValueChange={(e) => onDistanceUnitChange(e.value)}
            disabled={location === undefined}
          >
            <SegmentGroup.Indicator />
            <SegmentGroup.Items items={distanceUnitItems} />
          </SegmentGroup.Root>
        </HStack>
      </Field.Root>
    </VStack>
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
      width={{ base: "full", md: "3xs" }}
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
