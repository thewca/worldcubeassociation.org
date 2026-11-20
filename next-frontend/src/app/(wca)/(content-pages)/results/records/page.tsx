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
type RecordsPageProps = Pick<PageProps<"/results/records">, "searchParams">;
type SearchParams = Awaited<RecordsPageProps["searchParams"]>;

export default function RecordsPage({ searchParams }: RecordsPageProps) {
  return (
    <Suspense fallback={<Loading />}>
      <Records searchParams={searchParams} />
    </Suspense>
  );
}

async function Records({ searchParams }: RecordsPageProps) {
  const params = toURLSearchParams(await searchParams);

  const queryClient = new QueryClient();
  const options = getRecordsQueryOptions(serverQueryApi, getFilters(params));
  await queryClient.query(options).catch(noop);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FilteredRecords />
    </HydrationBoundary>
  );
}

function toURLSearchParams(searchParams: SearchParams) {
  const entries = Object.entries(searchParams).flatMap(([key, value]) => {
    const values = typeof value === "string" ? [value] : (value ?? []);
    return values.map((item) => [key, item]);
  });

  return new URLSearchParams(entries);
}
