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
    shouldShowChampionshipOnly,
    sort,
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

  searchParams["championship_only"] = shouldShowChampionshipOnly;

  if (timeOrder === "present") {
    searchParams["ongoing_and_future"] = dateNow.toISODate();
  } else if (timeOrder === "recent") {
    const recentDaysAgo = dateNow.minus({
      days: competitionConstants.competitionRecentDays,
    });

    searchParams["start"] = recentDaysAgo.toISODate();
    searchParams["end"] = dateNow.toISODate();
  } else if (timeOrder === "past") {
    if (selectedYear === "all_years") {
      searchParams["end"] = dateNow.toISODate();
    } else {
      searchParams["start"] = `${selectedYear}-1-1`;
      searchParams["end"] =
        dateNow.year === selectedYear
          ? dateNow.toISODate()
          : `${selectedYear}-12-31`;
    }
  } else if (timeOrder === "custom") {
    // Either end of the range may be left open, in which case we omit the bound entirely.
    if (customStartDate) {
      searchParams["start"] = customStartDate;
    }
    if (customEndDate) {
      searchParams["end"] = customEndDate;
    }
  }

  if (sort) {
    searchParams["sort"] = sort;
  }

  return searchParams;
}

// All the possible sort values at the moment
// Adding an element here automatically adds it to select options
// Translations and competition.rb support must be done by hand
export const sortOrderValues = [
  { value: "start_date", key: "start_date_asc" },
  { value: "-start_date", key: "start_date_desc" },
  { value: "end_date", key: "end_date_asc" },
  { value: "-end_date", key: "end_date_desc" },
  { value: "name", key: "name_asc" },
  { value: "-name", key: "name_desc" },
  { value: "announced_at", key: "announced_at_asc" },
  { value: "-announced_at", key: "announced_at_desc" },
];
