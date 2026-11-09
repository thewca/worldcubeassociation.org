import { getFilters, getRecordsQueryOptions } from "@/lib/wca/results/records";
import { serverQueryApi } from "@/lib/wca/wcaAPI";
import {
  dehydrate,
  HydrationBoundary,
  noop,
  QueryClient,
} from "@tanstack/react-query";
import React, { Suspense } from "react";
import FilteredRecords from "@/app/(wca)/(content-pages)/results/records/filteredRecords";
import { Metadata } from "next";
import { getT } from "@/lib/i18n/get18n";
import Loading from "@/components/ui/loading";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("results.records.title"),
  };
}
type RecordsPageProps = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export default function RecordsPage({ searchParams }: RecordsPageProps) {
  return (
    <Suspense fallback={<Loading />}>
      <Records searchParams={searchParams} />
    </Suspense>
  );
}

async function Records({ searchParams }: RecordsPageProps) {
  const params = new URLSearchParams(
    Object.entries(await searchParams).flatMap(([key, value]) =>
      value === undefined ? [] : [[key, value]],
    ),
  );
  const filters = getFilters(params);

  const queryClient = new QueryClient();
  const options = getRecordsQueryOptions(serverQueryApi, filters);
  await queryClient.query(options).catch(noop);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FilteredRecords />
    </HydrationBoundary>
  );
}
