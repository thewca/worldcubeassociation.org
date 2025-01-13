import React, {
  useEffect, useMemo, useReducer, useState,
} from 'react';
import { Container } from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import RankingsTable from './RankingsTable';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';
import { getRankings } from '../api/rankings';
import Loading from '../../Requests/Loading';
import { rankingsUrl } from '../../../lib/requests/routes.js.erb';
import ResultsFilter from '../resultsFilter';

const ActionTypes = {
  SET_EVENT: 'SET_EVENT',
  SET_REGION: 'SET_REGION',
  SET_RANKING_TYPE: 'SET_RANKING_TYPE',
  SET_GENDER: 'SET_GENDER',
  SET_SHOW: 'SET_SHOW',
};

function filterReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_EVENT:
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

export default function Wrapper({
  event, region, year, rankingType, gender, show,
}) {
  return (
    <WCAQueryClientProvider>
      <Rankings
        initialEvent={event}
        initialRegion={region}
        initialYear={year}
        initialRankingType={rankingType}
        initialGender={gender}
        initialShow={show}
      />
    </WCAQueryClientProvider>
  );
}

export function Rankings({
  initialEvent, initialRegion, initialRankingType, initialGender, initialShow,
}) {
  // Define the initial state
  const initialState = useMemo(() => ({
    event: initialEvent,
    region: initialRegion,
    rankingType: initialRankingType,
    gender: initialGender,
    show: initialShow,
  }), [initialEvent, initialGender, initialRankingType, initialRegion, initialShow]);

  // Use the reducer
  const [filterState, dispatch] = useReducer(filterReducer, initialState);

  const filterActions = useMemo(
    () => ({
      setEvent: (event) => dispatch({ type: ActionTypes.SET_EVENT, payload: event }),
      setRegion: (region) => dispatch({ type: ActionTypes.SET_REGION, payload: region }),
      setRankingType: (rankingType) => dispatch({ type: ActionTypes.SET_RANKING_TYPE, payload: rankingType }),
      setGender: (gender) => dispatch({ type: ActionTypes.SET_GENDER, payload: gender }),
      setShow: (show) => dispatch({ type: ActionTypes.SET_SHOW, payload: show }),
    }),
    [dispatch],
  );

  const {
    event, region, rankingType, gender, show,
  } = filterState;

  const { data, isFetching } = useQuery({
    queryKey: ['rankings', event, region, rankingType, gender, show],
    queryFn: () => getRankings(event, rankingType, region, gender, show),
  });

  useEffect(() => {
    window.history.replaceState(null, '', rankingsUrl(event, rankingType, region, gender, show));
  }, [event, region, rankingType, gender, show]);

  if (isFetching) {
    return <Loading />;
  }

  return (
    <Container fluid>
      <ResultsFilter filterState={filterState} filterActions={filterActions} />
      <RankingsTable
        competitionsById={data.competitionsById}
        isAverage={rankingType === 'average'}
        rows={data.rows}
        show={show}
      />
    </Container>
  );
}
