"use client";

import { components } from "@/types/openapi";
import React, { useMemo, useReducer } from "react";
import { useQuery } from "@tanstack/react-query";
import useAPI from "@/lib/wca/useAPI";
import events, { WCA_EVENT_IDS } from "@/lib/wca/data/events";
import { CurrentEventId } from "@wca/helpers";
import { Alert, Heading, VStack } from "@chakra-ui/react";
import EventIcon from "@/components/EventIcon";
import RecordsTable from "@/components/results/RecordsTable";
import Loading from "@/components/ui/loading";
import FilterBox from "@/components/results/FilterBox";

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
  event: string;
  region: string;
  gender: string;
  show: string;
};

interface filteredRecordsProps {
  initialRecords: components["schemas"]["RecordByEvent"];
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
  initialRecords,
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
  const api = useAPI();

  const {
    data: records,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ["records", event, region, gender, show],
    queryFn: () =>
      api
        .GET("/results/records", {
          params: {
            query: { event_id: event, region, show, gender },
          },
        })
        .then((res) => res.data!.records),
    initialData: () => {
      if (
        region !== searchParams.region ||
        gender !== searchParams.gender ||
        show !== searchParams.show
      ) {
        return undefined;
      }
      if (event !== searchParams.event) {
        return {
          [event as CurrentEventId]: initialRecords[event as CurrentEventId],
        };
      }
      return initialRecords;
    },
    refetchOnMount: false,
  });

  if (isFetching) {
    return <Loading />;
  }

  if (isError) {
    return (
      <Alert.Root status={"error"}>
        <Alert.Title>Error fetching Records</Alert.Title>
      </Alert.Root>
    );
  }

  return (
    <VStack align={"left"} gap={4}>
      <FilterBox filterState={filterState} filterActions={filterActions} />
      {WCA_EVENT_IDS.map((event) => {
        const recordsByEvent = records[event as CurrentEventId];

        return (
          recordsByEvent && (
            <React.Fragment key={event}>
              <Heading size={"2xl"} key={event}>
                <EventIcon eventId={event} /> {events.byId[event].name}
              </Heading>
              <RecordsTable records={recordsByEvent} />
            </React.Fragment>
          )
        );
      })}
    </VStack>
  );
}
