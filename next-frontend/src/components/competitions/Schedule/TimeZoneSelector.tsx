"use client";

import { useMemo, useState } from "react";
import {
  Button,
  ButtonGroup,
  Checkbox,
  Combobox,
  HStack,
  useFilter,
  createListCollection,
  VStack,
} from "@chakra-ui/react";
import _ from "lodash";
import { sortByOffset } from "@/lib/wca/timezone";
import { availableTimeZones, currentTimeZone } from "@/lib/wca/data/timezones";
import { useTranslation } from "react-i18next";
import LocationIcon from "@/components/icons/LocationIcon";
import { LuHouse } from "react-icons/lu";
import { DateTime } from "luxon";

import useAPI from "@/lib/wca/useAPI";
import type { WcifVenue } from "@/lib/wca/wcif/activities";

interface TimeZoneSelectorProps {
  activeVenue?: WcifVenue;
  hasMultipleVenues: boolean;
  activeTimeZone: string;
  setActiveTimeZone: (tz: string) => void;
  followVenueSelection: boolean;
  setFollowVenueSelection: (follow: boolean) => void;
}

export default function TimeZoneSelector({
  activeVenue,
  hasMultipleVenues,
  activeTimeZone,
  setActiveTimeZone,
  followVenueSelection,
  setFollowVenueSelection,
}: TimeZoneSelectorProps) {
  const { t } = useTranslation();

  const [inputFilter, setInputFilter] = useState("");
  const { contains } = useFilter({ sensitivity: "base" });

  const api = useAPI();

  // TODO GB: Load this on the server already and pass the list as prop to the client
  const { data: apiTimeZones } = api.useQuery("get", "/v0/known-timezones");

  const backendTimeZones = apiTimeZones || [];
  // It literally doesn't matter what the exact value of this date is,
  //   so we don't need to care about memoizing.
  // All that matters is that it stays consistent within one render cycle (which it does by definition)
  const randomReferenceDate = DateTime.now().toISO();

  const uniqueTimeZones = _.uniq(backendTimeZones.concat(availableTimeZones));
  const sortedTimeZones = sortByOffset(uniqueTimeZones, randomReferenceDate);

  const filteredTimeZones = useMemo(
    () =>
      sortedTimeZones.filter(
        (tz) => activeTimeZone === inputFilter || contains(tz, inputFilter),
      ),
    [activeTimeZone, contains, inputFilter, sortedTimeZones],
  );

  const collection = useMemo(
    () => createListCollection({ items: filteredTimeZones }),
    [filteredTimeZones],
  );

  const clearInputFilter = () => setInputFilter("");

  const handleValueChange = (e: Combobox.ValueChangeDetails) => {
    setActiveTimeZone(e.value[0]);
    clearInputFilter();
  };

  return (
    <VStack alignItems="start">
      <Combobox.Root
        closeOnSelect
        collection={collection}
        inputValue={activeTimeZone}
        onInputValueChange={(e) => setInputFilter(e.inputValue)}
        value={[activeTimeZone]}
        defaultValue={[activeTimeZone]}
        onValueChange={handleValueChange}
        onSelect={clearInputFilter}
        selectionBehavior="preserve"
      >
        <Combobox.Label>
          {t("competitions.schedule.timezone_setting")}
        </Combobox.Label>
        <Combobox.Control>
          <Combobox.Input placeholder="Nothing selected" />
          <Combobox.IndicatorGroup>
            <Combobox.Trigger />
          </Combobox.IndicatorGroup>
        </Combobox.Control>
        <Combobox.Positioner>
          <Combobox.Content>
            <Combobox.Empty>No items found</Combobox.Empty>
            {collection.items.map((item) => (
              <Combobox.Item item={item} key={item}>
                <Combobox.ItemText>{item}</Combobox.ItemText>
                <Combobox.ItemIndicator />
              </Combobox.Item>
            ))}
          </Combobox.Content>
        </Combobox.Positioner>
      </Combobox.Root>
      <HStack>
        <ButtonGroup size="sm">
          <Button onClick={() => setActiveTimeZone(currentTimeZone)}>
            <LuHouse />
            {t("competitions.schedule.timezone_set_local")}
          </Button>
          {activeVenue && (
            <Button onClick={() => setActiveTimeZone(activeVenue.timezone)}>
              <LocationIcon />
              {t("competitions.schedule.timezone_set_venue")}
            </Button>
          )}
        </ButtonGroup>
        {hasMultipleVenues && (
          <Checkbox.Root
            checked={followVenueSelection}
            onCheckedChange={(e) => setFollowVenueSelection(Boolean(e.checked))}
          >
            <Checkbox.Control />
            <Checkbox.Label>
              {t("competitions.schedule.timezone_follow_venue")}
            </Checkbox.Label>
          </Checkbox.Root>
        )}
      </HStack>
    </VStack>
  );
}
