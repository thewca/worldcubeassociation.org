"use client";

import {
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  ClientOnly,
  Collapsible,
  CloseButton,
  DatePicker,
  Field,
  Group,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  NativeSelect,
  NumberInput,
  parseDate,
  Portal,
  SegmentGroup,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  VStack,
  Wrap,
} from "@chakra-ui/react";
import { AllCompsIcon } from "@/components/icons/AllCompsIcon";
import MapIcon from "@/components/icons/MapIcon";
import ListIcon from "@/components/icons/ListIcon";
import CompetitionTableRow from "@/components/CompetitionTableRow";
import RemovableCard from "@/components/RemovableCard";
// import CompRegoFullButOpenOrangeIcon from "@/components/icons/CompRegoFullButOpen_orangeIcon";
import CompRegoNotFullOpenGreenIcon from "@/components/icons/CompRegoNotFullOpen_greenIcon";
import CompRegoNotOpenYetGreyIcon from "@/components/icons/CompRegoNotOpenYet_greyIcon";
import CompRegoClosedRedIcon from "@/components/icons/CompRegoClosed_redIcon";
import CompRegoOpenDateIcon from "@/components/icons/CompRegoOpenDateIcon";
import CompRegoCloseDateIcon from "@/components/icons/CompRegoCloseDateIcon";

import { Trans } from "react-i18next";
import { useSession } from "@/auth.client";
import { Dispatch, ReactNode, useReducer, useState } from "react";
import {
  competitionFilterReducer,
  createFilterState,
  type CompetitionFilterAction,
  type CompetitionFilterState,
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
import { getDistanceInKm } from "@/lib/math/geolocation";
import type { GeoCoordinates } from "@/lib/types/geolocation";
import { FormEventSelector } from "@/components/EventSelector";
import TabMap from "@/components/competitions/TabMap";
import { LuMapPin, LuSettings2 } from "react-icons/lu";
import BetaDisabledTooltip from "@/components/BetaDisabledTooltip";
import { isInProgress } from "@/lib/wca/competitions/statusUtils";
import { nonFutureCompetitionYears } from "@/lib/wca/data/competitions";
import _ from "lodash";

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

  const bottomRef = useOnInView((inView) => {
    if (inView && hasMoreCompsToLoad && !competitionsIsFetching) {
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

  const showInProgressSection = debouncedFilterState.timeOrder === "present";

  const [inProgressComps, upcomingComps] = _.partition(
    competitionsDistanceFiltered,
    (competition) => showInProgressSection && isInProgress(competition),
  );

  const loadedCompetitionCount =
    rawCompetitionData?.pages.reduce((total, page) => total + page.length, 0) ??
    0;

  return (
    <VStack gap="8" width="full">
      <ClientOnly>
        {!session.isPending && !session.data && (
          <RemovableCard
            imageUrl="newcomer.png"
            heading="Why Compete?"
            descriptionAs="div"
            description={
              <Trans
                t={t}
                i18nKey="competitions.index.why_compete_description_html"
              />
            }
            buttonText="Learn More"
            buttonUrl="/faq"
          />
        )}
      </ClientOnly>
      <Card.Root size={{ base: "sm", md: "md" }} width="full">
        <Tabs.Root
          variant="subtle"
          colorPalette="blue"
          defaultValue="list"
          lazyMount
          unmountOnExit
        >
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
            <Collapsible.Root asChild>
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
                  <Collapsible.Trigger asChild>
                    <Button
                      variant="outline"
                      width={{ base: "full", lg: "auto" }}
                    >
                      <Icon>
                        <LuSettings2 />
                      </Icon>{" "}
                      {t("competitions.index.advanced_filters")}
                    </Button>
                  </Collapsible.Trigger>
                </Stack>
                <Collapsible.Content width="full">
                  <AdvancedFilters
                    filterState={filterState}
                    dispatchFilter={dispatchFilter}
                    t={t}
                  />
                </Collapsible.Content>
              </VStack>
            </Collapsible.Root>
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
                  {/* Currently disabled until we have accepted registrations as part of the API https://github.com/thewca/worldcubeassociation.org/pull/15651 */}
                  {/* <Badge size="md" variant="surface"> */}
                  {/*  <CompRegoFullButOpenOrangeIcon /> */}
                  {/*  {t("competitions.index.registration_status.full")} */}
                  {/* </Badge> */}
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
              <Table.ScrollArea>
                <Table.Root size="xs" variant="competitions" borderWidth="2px">
                  <Table.Body>
                    {inProgressComps.length > 0 && (
                      <>
                        <TableHeaderRow>
                          {t("competitions.index.titles.in_progress")}
                        </TableHeaderRow>
                        {inProgressComps.map((comp) => (
                          <CompetitionTableRow comp={comp} key={comp.id} />
                        ))}
                        <TableHeaderRow>
                          {t("competitions.index.titles.upcoming")}
                        </TableHeaderRow>
                      </>
                    )}
                    {upcomingComps.map((comp) => (
                      <CompetitionTableRow comp={comp} key={comp.id} />
                    ))}
                  </Table.Body>
                </Table.Root>
              </Table.ScrollArea>
              <ListViewFooter
                isLoading={competitionsIsFetching}
                hasMoreCompsToLoad={hasMoreCompsToLoad}
                numCompetitions={competitionsDistanceFiltered.length}
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

function AdvancedFilters({
  filterState,
  dispatchFilter,
  t,
}: {
  filterState: CompetitionFilterState;
  dispatchFilter: Dispatch<CompetitionFilterAction>;
  t: TFunction;
}) {
  const timeOrderItems = [
    { value: "present", label: t("competitions.index.present") },
    {
      value: "recent",
      label: t("competitions.index.recent"),
    },
    { value: "past", label: t("competitions.index.past") },
    {
      value: "by_announcement",
      label: t("competitions.index.by_announcement"),
    },
  ];

  return (
    <Stack
      direction={{ base: "column", lg: "row" }}
      gap="4"
      width="full"
      align={{ base: "stretch", lg: "flex-end" }}
    >
      <Field.Root width="auto">
        <Field.Label>{t("competitions.index.state")}</Field.Label>
        <SegmentGroup.Root
          hideBelow="md"
          value={filterState.timeOrder}
          onValueChange={(e) =>
            dispatchFilter({ type: "set_time_order", timeOrder: e.value! })
          }
        >
          <SegmentGroup.Indicator />
          <SegmentGroup.Items items={timeOrderItems} />
        </SegmentGroup.Root>
        <NativeSelect.Root hideFrom="md">
          <NativeSelect.Field
            value={filterState.timeOrder}
            onChange={(e) =>
              dispatchFilter({
                type: "set_time_order",
                timeOrder: e.target.value,
              })
            }
          >
            {timeOrderItems.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Field.Root>

      {filterState.timeOrder === "past" && (
        <Field.Root width={{ base: "full", lg: "3xs" }}>
          <Field.Label>{t("media.media_table.year")}</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={filterState.selectedYear.toString()}
              onChange={(e) =>
                dispatchFilter({
                  type: "set_selected_year",
                  selectedYear: Number(e.target.value) || "all_years",
                })
              }
            >
              <option value="all_years">
                {t("competitions.index.all_years")}
              </option>
              {nonFutureCompetitionYears.toReversed().map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
      )}

      <Checkbox.Root
        width="auto"
        minHeight="10"
        checked={filterState.shouldIncludeCancelled}
        onCheckedChange={(e) =>
          dispatchFilter({
            type: "set_should_include_cancelled",
            shouldIncludeCancelled: Boolean(e.checked),
          })
        }
      >
        <Checkbox.HiddenInput />
        <Checkbox.Control />
        <Checkbox.Label>
          {t("competitions.index.show_cancelled")}
        </Checkbox.Label>
      </Checkbox.Root>
    </Stack>
  );
}

function TableHeaderRow({
  children,
  colSpan = 7,
}: {
  children: ReactNode;
  colSpan?: number;
}) {
  return (
    <Table.Row cursor="default">
      <Table.Cell
        colSpan={colSpan}
        // overrides the default highlighting behavior
        _hover={{ bg: "bg", _odd: { bg: "bg.subtle" } }}
      >
        <Heading textStyle="s4" textAlign="center">
          {children}
        </Heading>
      </Table.Cell>
    </Table.Row>
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
      <Box textAlign="center" width="full">
        <Loading />
      </Box>
    );
  }

  if (!hasMoreCompsToLoad) {
    return (
      numCompetitions > 0 && (
        <Box textAlign="center" width="full">
          {t("competitions.index.no_more_comps")}
        </Box>
      )
    );
  }

  return <Box ref={bottomRef} />;
}
