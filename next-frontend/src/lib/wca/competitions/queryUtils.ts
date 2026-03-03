import { DateTime } from "luxon";
import { competitionConstants } from "@/lib/wca/data/competitions";
import { CompetitionFilterState } from "@/lib/wca/competitions/filterUtils";

import type { operations } from "@/types/openapi";

type CompetitionListQueryParams =
  operations["competitionList"]["parameters"]["query"];

const isContinent = (region: string) => region[0] === "_";

export function createSearchParams(
  filterState: CompetitionFilterState,
  canViewAdminDetails = false,
): CompetitionListQueryParams {
  const {
    region,
    selectedEvents,
    delegate,
    search,
    timeOrder,
    selectedYear,
    customStartDate,
    customEndDate,
    adminStatus,
    shouldIncludeCancelled,
  } = filterState;

  const dateNow = DateTime.now();
  const searchParams: CompetitionListQueryParams = {};

  if (region && region !== "all") {
    const regionParam = isContinent(region) ? "continent" : "country_iso2";
    searchParams[regionParam] = region;
  }
  if (selectedEvents && selectedEvents.length > 0) {
    searchParams["event_ids[]"] = selectedEvents;
  }
  if (delegate) {
    searchParams["delegate"] = delegate.toString();
  }
  if (search) {
    searchParams["q"] = search;
  }
  if (canViewAdminDetails && adminStatus && adminStatus !== "all") {
    searchParams["admin_status"] = adminStatus;
  }
  searchParams["include_cancelled"] = shouldIncludeCancelled;

  if (timeOrder === "present") {
    searchParams["sort"] = "start_date,end_date,name";
    searchParams["ongoing_and_future"] = dateNow.toISODate();
  } else if (timeOrder === "recent") {
    const recentDaysAgo = dateNow.minus({
      days: competitionConstants.competitionRecentDays,
    });

    searchParams["sort"] = "-end_date,-start_date,name";
    searchParams["start"] = recentDaysAgo.toISODate();
    searchParams["end"] = dateNow.toISODate();
  } else if (timeOrder === "past") {
    if (selectedYear === "all_years") {
      searchParams["sort"] = "-end_date,-start_date,name";
      searchParams["end"] = dateNow.toISODate();
    } else {
      searchParams["sort"] = "-end_date,-start_date,name";
      searchParams["start"] = `${selectedYear}-1-1`;
      searchParams["end"] =
        dateNow.year === selectedYear
          ? dateNow.toISODate()
          : `${selectedYear}-12-31`;
    }
  } else if (timeOrder === "by_announcement") {
    searchParams["sort"] = "-announced_at,name";
  } else if (timeOrder === "custom") {
    const startLuxon = DateTime.fromISO(customStartDate!, { zone: "UTC" });
    const endLuxon = DateTime.fromISO(customEndDate!, { zone: "UTC" });

    searchParams["sort"] = "start_date,end_date,name";
    searchParams["start"] = startLuxon.isValid ? startLuxon.toISODate() : "";
    searchParams["end"] = endLuxon.isValid ? endLuxon.toISODate() : "";
  }

  return searchParams;
}
