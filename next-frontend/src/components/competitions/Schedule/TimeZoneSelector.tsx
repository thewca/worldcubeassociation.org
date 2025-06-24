"use client";

import {
  Button,
  Checkbox,
  Box,
  Combobox,
  Heading,
  useFilter,
  useListCollection,
} from "@chakra-ui/react";
import _ from "lodash";
import { sortByOffset } from "@/lib/wca/timezone";
import { availableTimeZones, currentTimeZone } from "@/lib/wca/data/timezones";
import { useTranslation } from "react-i18next";
import LocationIcon from "@/components/icons/LocationIcon";
import { LuHouse } from "react-icons/lu";
import { useQuery } from "@tanstack/react-query";
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

  const { contains } = useFilter({ sensitivity: "base" });

  const api = useAPI();

  const { data: apiTimeZones } = useQuery({
    queryKey: ["backend-timezones"],
    queryFn: () => api.GET("/known-timezones"),
    select: (data) => data.data,
  });

  const backendTimeZones = apiTimeZones || [];
  // It literally doesn't matter what the exact value of this date is,
  //   so we don't need to care about memoizing.
  // All that matters is that it stays consistent within one render cycle (which it does by definition)
  const randomReferenceDate = new Date().toISOString();

  const uniqueTimeZones = _.uniq(backendTimeZones.concat(availableTimeZones));
  const sortedTimeZones = sortByOffset(uniqueTimeZones, randomReferenceDate);

  const { collection, filter } = useListCollection({
    initialItems: sortedTimeZones,
    filter: contains,
  });

  return (
    <Box>
      <Heading size="sm">{t("competitions.schedule.time_zone")}</Heading>
      <Combobox.Root
        collection={collection}
        onInputValueChange={(e) => filter(e.inputValue)}
        value={[activeTimeZone]}
        onValueChange={(e) => setActiveTimeZone(e.value[0])}
      >
        <Combobox.Label>
          {t("competitions.schedule.timezone_setting")}
        </Combobox.Label>
        <Combobox.Control>
          <Combobox.Input placeholder="Yay?" />
          <Combobox.IndicatorGroup>
            <Combobox.ClearTrigger />
            <Combobox.Trigger />
          </Combobox.IndicatorGroup>
        </Combobox.Control>
        <Combobox.Positioner>
          <Combobox.Content>
            <Combobox.Empty>No items found</Combobox.Empty>
            {collection.items.map((item) => (
              <Combobox.Item item={item} key={item}>
                {item}
                <Combobox.ItemIndicator />
              </Combobox.Item>
            ))}
          </Combobox.Content>
        </Combobox.Positioner>
      </Combobox.Root>
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
    </Box>
  );
}
