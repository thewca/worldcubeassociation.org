import { getRecords } from "@/lib/wca/results/records";
import { Alert } from "@chakra-ui/react";
import React from "react";
import FilteredRecords from "@/app/(wca)/results/records/filteredRecords";
import { Metadata } from "next";
import { getT } from "@/lib/i18n/get18n";

const GENDER_ALL = "All";
const EVENTS_ALL = "all events";
const SHOW_MIXED = "mixed";
const SHOW_HISTORY = "history";
const SHOW_MIXED_HISTORY = "mixed history";
const REGION_WORLD = "world";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("results.records.title"),
  };
}
export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const {
    gender = GENDER_ALL,
    region = REGION_WORLD,
    show = SHOW_MIXED,
    event = EVENTS_ALL,
  } = await searchParams;

  // Both history views read from the history data set; the API only distinguishes history from
  //   everything else, the same way `@is_histories` does in the Rails controller.
  const isHistory = show === SHOW_HISTORY || show === SHOW_MIXED_HISTORY;

  const recordRequest = await getRecords({
    gender,
    region,
    show: isHistory ? "history" : "mixed",
  });

  if (recordRequest.error) {
    return (
      <Alert.Root status="error">
        <Alert.Title>Error fetching Records</Alert.Title>
      </Alert.Root>
    );
  }

  return (
    <>
      <FilteredRecords
        searchParams={{ gender, region, show, event }}
        records={recordRequest.data.records}
        timestamp={recordRequest.data.timestamp}
      />
    </>
  );
}
