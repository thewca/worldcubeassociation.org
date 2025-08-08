import { getT } from "@/lib/i18n/get18n";
import { getRecords } from "@/lib/wca/results/records";
import { Alert, Container, Heading, VStack } from "@chakra-ui/react";
import React from "react";
import FilteredRecords from "@/app/(wca)/results/records/filteredRecords";

const GENDER_ALL = "All";
const EVENTS_ALL = "all events";
const SHOW_MIXED = "mixed";
const REGION_WORLD = "world";

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { t } = await getT();

  const {
    gender = GENDER_ALL,
    event = EVENTS_ALL,
    region = REGION_WORLD,
    show = SHOW_MIXED,
  } = await searchParams;

  const response = await getRecords({
    gender,
    event,
    region,
    show,
  });

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
          initialRecords={response.data.records}
          searchParams={{ gender, event, region, show }}
        />
      </VStack>
    </Container>
  );
}
