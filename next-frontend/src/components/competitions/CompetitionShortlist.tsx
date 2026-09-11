import { DataList, Text, VStack, Wrap } from "@chakra-ui/react";
import WcaFlag from "@/components/WcaFlag";
import CountryMap from "@/components/CountryMap";
import CompRegoCloseDateIcon from "@/components/icons/CompRegoCloseDateIcon";
import { formatDateRange } from "@/lib/dates/format";
import RegisterIcon from "@/components/icons/RegisterIcon";
import React from "react";
import type { components } from "@/types/openapi";
import { TFunction } from "i18next";
import EventIcon from "@/components/EventIcon";
import MapIcon from "@/components/icons/MapIcon";
import PaymentIcon from "@/components/icons/PaymentIcon";
import CurrencyValue from "@/components/CurrencyValue";

type CompetitionIndex = components["schemas"]["CompetitionIndex"];
type CompetitionInfo = components["schemas"]["CompetitionInfo"];

type DataListItem =
  "location" | "date" | "events" | "spots_left" | "address" | "entry_fee";

function ShortlistItem({
  comp,
  t,
  item,
}: {
  comp: CompetitionIndex | CompetitionInfo;
  t: TFunction;
  item: DataListItem;
}) {
  switch (item) {
    case "events":
      return (
        <DataList.Item>
          <DataList.ItemLabel>Events</DataList.ItemLabel>
          <DataList.ItemValue asChild>
            <Wrap gap="4">
              {comp.event_ids.map((event_id) => (
                <EventIcon
                  key={event_id}
                  eventId={event_id}
                  boxSize="6"
                  color={
                    event_id === comp.main_event_id && event_id !== "333"
                      ? "green.solid"
                      : "currentColor"
                  }
                />
              ))}
            </Wrap>
          </DataList.ItemValue>
        </DataList.Item>
      );
    case "date":
      return (
        <DataList.Item>
          <DataList.ItemLabel asChild>
            <CompRegoCloseDateIcon size="2xl" />
          </DataList.ItemLabel>
          <DataList.ItemValue>
            {formatDateRange(comp.start_date, comp.end_date)}
          </DataList.ItemValue>
        </DataList.Item>
      );
    case "location":
      return (
        <DataList.Item>
          <DataList.ItemLabel asChild>
            <WcaFlag code={comp.country_iso2} size="xl" />
          </DataList.ItemLabel>
          <DataList.ItemValue gap="2">
            <CountryMap code={comp.country_iso2} t={t} fontWeight="bold" />
            <Text>{comp.city}</Text>
          </DataList.ItemValue>
        </DataList.Item>
      );
    case "address":
      return (
        <DataList.Item>
          <DataList.ItemLabel asChild>
            <MapIcon size="2xl" />
          </DataList.ItemLabel>
          <DataList.ItemValue>
            <Text>{comp.venue_address}</Text>
          </DataList.ItemValue>
        </DataList.Item>
      );
    case "entry_fee":
      return (
        <DataList.Item>
          <DataList.ItemLabel asChild>
            <PaymentIcon size="2xl" />
          </DataList.ItemLabel>
          <DataList.ItemValue>
            <CurrencyValue
              lowestDenomination={comp.base_entry_fee_lowest_denomination}
              currencyCode={comp.currency_code}
            />
          </DataList.ItemValue>
        </DataList.Item>
      );
    case "spots_left": {
      if ("spots_left" in comp && comp.spots_left != null) {
        return (
          <DataList.Item>
            <DataList.ItemLabel>
              <RegisterIcon />
            </DataList.ItemLabel>
            <DataList.ItemValue>
              {t("competitions.messages.spots_left", {
                count: comp.spots_left,
              })}
            </DataList.ItemValue>
          </DataList.Item>
        );
      }

      return null;
    }
  }
}

export default function CompetitionShortlist({
  comp,
  t,
  items,
}: {
  comp: CompetitionIndex | CompetitionInfo;
  t: TFunction;
  items: DataListItem[];
}) {
  return (
    <VStack alignItems="start" gap="4">
      <DataList.Root orientation="horizontal" size="lg" iconLabel>
        {items.map((dataItem) => (
          <ShortlistItem key={dataItem} comp={comp} t={t} item={dataItem} />
        ))}
      </DataList.Root>
    </VStack>
  );
}
