import { getT } from "@/lib/i18n/get18n";
import { getRecords } from "@/lib/wca/results/records";
import { Alert, Container, Heading, VStack } from "@chakra-ui/react";
import React from "react";
import FilteredRecords from "@/app/(wca)/results/records/filteredRecords";

const GENDER_ALL = "All";
const EVENTS_ALL = "all events";
const SHOW_MIXED = "mixed";
const REGION_WORLD = "world";
const TYPE_SINGLE = "single";

export default async function RecordsPage(
  searchParams: Promise<{ [key: string]: string | undefined }>,
) {
  const { t } = await getT();

  const response = await getRecords();

  const {
    gender = GENDER_ALL,
    event = EVENTS_ALL,
    region = REGION_WORLD,
    show = SHOW_MIXED,
    type = TYPE_SINGLE,
  } = await searchParams;

  if (response.error) {
    return (
      <Alert.Root status={"error"}>
        <Alert.Title>Error fetching Records</Alert.Title>
      </Alert.Root>
    );
  }

  return (
    <Container bg={"bg"}>
      <VStack align={"left"} gap={4}>
        <Heading size={"5xl"}>{t("results.records.title")}</Heading>
        {t("results.last_updated_html", { timestamp: response.data.timestamp })}
        <FilteredRecords
          initialRecords={{ data: response.data }}
          searchParams={{ gender, event, region, show, rankingType: type }}
        />
      </VStack>
    </Container>
  );
}
