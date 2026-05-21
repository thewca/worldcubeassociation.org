import { DataList, Icon, Text, VStack } from "@chakra-ui/react";
import WcaFlag from "@/components/WcaFlag";
import CountryMap from "@/components/CountryMap";
import CompRegoCloseDateIcon from "@/components/icons/CompRegoCloseDateIcon";
import { formatDateRange } from "@/lib/dates/format";
import RegisterIcon from "@/components/icons/RegisterIcon";
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
            <Icon size="xl" ring="1px" ringColor="blackAlpha.200">
              <WcaFlag code={comp.country_iso2} fallback={comp.country_iso2} />
            </Icon>
          </DataList.ItemLabel>
          <DataList.ItemValue gap="2">
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
        {"spots_left" in comp && comp.spots_left != null && (
          <DataList.Item>
            <DataList.ItemLabel>
              <RegisterIcon />
            </DataList.ItemLabel>
            <DataList.ItemValue>
              {comp.spots_left} Spots Left
            </DataList.ItemValue>
          </DataList.Item>
        )}
      </DataList.Root>
    </VStack>
  );
}
