"use client";

import React, { useMemo, useReducer } from "react";
import useAPI from "@/lib/wca/useAPI";
import { EventId } from "@/lib/wca/data/events";
import { Alert, Heading, VStack } from "@chakra-ui/react";
import RecordsTable from "@/components/results/RecordsTable";
import Loading from "@/components/ui/loading";
import { RecordsFilterBox } from "@/components/results/FilterBox";
import { useT } from "@/lib/i18n/useI18n";

type ValidActions =
  | "SET_EVENT"
  | "SET_REGION"
  | "SET_RANKING_TYPE"
  | "SET_GENDER"
  | "SET_SHOW";

const ActionTypes: Record<ValidActions, ValidActions> = {
  SET_EVENT: "SET_EVENT",
  SET_REGION: "SET_REGION",
  SET_RANKING_TYPE: "SET_RANKING_TYPE",
  SET_GENDER: "SET_GENDER",
  SET_SHOW: "SET_SHOW",
};

type FilterAction = {
  type: ValidActions;
  payload: string;
};

type FilterParams = {
  event: EventId | "all events";
  region: string;
  gender: string;
  show: string;
};

interface filteredRecordsProps {
  searchParams: FilterParams;
}

function filterReducer(state: FilterParams, action: FilterAction) {
  switch (action.type) {
    case ActionTypes.SET_EVENT:
      if (action.payload === "333mbf") {
        return { ...state, event: action.payload, rankingType: "single" };
      }

      return { ...state, event: action.payload };
    case ActionTypes.SET_REGION:
      return { ...state, region: action.payload };
    case ActionTypes.SET_RANKING_TYPE:
      return { ...state, rankingType: action.payload };
    case ActionTypes.SET_GENDER:
      return { ...state, gender: action.payload };
    case ActionTypes.SET_SHOW:
      return { ...state, show: action.payload };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

export default function FilteredRecords({
  searchParams,
}: filteredRecordsProps) {
  const [filterState, dispatch] = useReducer(filterReducer, searchParams);

  const filterActions = useMemo(
    () => ({
      setEvent: (event: string) =>
        dispatch({ type: ActionTypes.SET_EVENT, payload: event }),
      setRegion: (region: string) =>
        dispatch({ type: ActionTypes.SET_REGION, payload: region }),
      setGender: (gender: string) =>
        dispatch({ type: ActionTypes.SET_GENDER, payload: gender }),
      setShow: (show: string) =>
        dispatch({ type: ActionTypes.SET_SHOW, payload: show }),
    }),
    [dispatch],
  );

  const { event, region, gender, show } = filterState;

  const { t } = useT();

  const api = useAPI();

  const isHistory = show === "history" || show === "mixed history";

  const { data, isFetching, isError } = api.useQuery(
    "get",
    "/v0/results/records",
    {
      params: {
        query: { region, gender, show: isHistory ? "history" : "mixed" },
      },
    },
    {
      select: (data) => {
        if (event === "all events") {
          return data;
        }

        return {
          timestamp: data.timestamp,
          records: {
            [event as EventId]: data.records[event],
          },
        };
      },
      refetchOnMount: false,
    },
  );

  if (isFetching) {
    return <Loading />;
  }

  if (isError) {
    return (
      <Alert.Root status="error">
        <Alert.Title>Error fetching Records</Alert.Title>
      </Alert.Root>
    );
  }

  return (
    <VStack align="left" gap={4}>
      <Heading size="5xl">{t("results.records.title")}</Heading>
      {t("results.last_updated_html", { timestamp: data!.timestamp })}
      <RecordsFilterBox
        filterState={filterState}
        filterActions={filterActions}
      />
      <RecordsTable records={data!.records!} show={show} />
    </VStack>
  );
}
