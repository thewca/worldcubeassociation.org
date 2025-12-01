import { DataList, HStack, Icon, Text, VStack } from "@chakra-ui/react";
import WcaFlag from "@/components/WcaFlag";
import CountryMap from "@/components/CountryMap";
import CompRegoCloseDateIcon from "@/components/icons/CompRegoCloseDateIcon";
import { formatDateRange } from "@/lib/dates/format";
import CompetitorsIcon from "@/components/icons/CompetitorsIcon";
import RegisterIcon from "@/components/icons/RegisterIcon";
import LocationIcon from "@/components/icons/LocationIcon";
import EventIcon from "@/components/EventIcon";
import React from "react";
import type { components } from "@/types/openapi";
import { TFunction } from "i18next";

type CompetitionIndex = components["schemas"]["CompetitionIndex"];
type CompetitionInfo = components["schemas"]["CompetitionInfo"];

export default function CompetitionShortlist({
  comp,
  t,
}: {
  comp: CompetitionIndex | CompetitionInfo;
  t: TFunction;
}) {
  return (
    <VStack alignItems="start" gap="4">
      <DataList.Root orientation="horizontal" size="lg" iconLabel>
        <DataList.Item>
          <DataList.ItemLabel>
            <Icon size="xl">
              <WcaFlag code={comp.country_iso2} fallback={comp.country_iso2} />
            </Icon>
          </DataList.ItemLabel>
          <DataList.ItemValue>
            <CountryMap code={comp.country_iso2} t={t} fontWeight="bold" />
            <Text>{comp.city}</Text>
          </DataList.ItemValue>
        </DataList.Item>
        <DataList.Item>
          <DataList.ItemLabel>
            <CompRegoCloseDateIcon size="2xl" />
          </DataList.ItemLabel>
          <DataList.ItemValue>
            {formatDateRange(comp.start_date, comp.end_date)}
          </DataList.ItemValue>
        </DataList.Item>
        <DataList.Item>
          <DataList.ItemLabel>
            <CompetitorsIcon />
          </DataList.ItemLabel>
          <DataList.ItemValue>
            {comp.competitor_limit} Competitor Limit
          </DataList.ItemValue>
        </DataList.Item>
        <DataList.Item>
          <DataList.ItemLabel>
            <RegisterIcon />
          </DataList.ItemLabel>
          <DataList.ItemValue>
            {comp.competitor_limit} Spots Left
          </DataList.ItemValue>
        </DataList.Item>
        <DataList.Item>
          <DataList.ItemLabel>
            <LocationIcon />
          </DataList.ItemLabel>
          <DataList.ItemValue>{comp.city}</DataList.ItemValue>
        </DataList.Item>
      </DataList.Root>
      <HStack paddingInline="1.5">
        {comp.event_ids.map((eventId) => (
          <EventIcon
            eventId={eventId}
            key={eventId}
            boxSize="7"
            color={
              eventId === comp.main_event_id && eventId !== "333"
                ? "green.1A"
                : "currentColor"
            }
          />
        ))}
      </HStack>
    </VStack>
  );
}
