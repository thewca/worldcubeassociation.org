import React, {
  useEffect, useMemo, useReducer,
} from 'react';
import { Container } from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import RecordsTable from './RecordsTable';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';
import { getRecords } from '../api/records';
import Loading from '../../Requests/Loading';
import { recordsUrl } from '../../../lib/requests/routes.js.erb';
import ResultsFilter from '../resultsFilter';

const ActionTypes = {
  SET_EVENT: 'SET_EVENT',
  SET_REGION: 'SET_REGION',
  SET_RANKING_TYPE: 'SET_RANKING_TYPE',
  SET_GENDER: 'SET_GENDER',
  SET_SHOW: 'SET_SHOW',
};

function parseInitialStateFromUrl(url) {
  const urlPattern = /\/results\/records\/(\d+)\/(\w+)/; // Matches `/results/rankings/{event}/{rankingType}`
  const match = url.match(urlPattern);

  if (!match) {
    throw new Error('URL does not match the expected pattern.');
  }

  const [, event, rankingType] = match; // Extract event and rankingType from regex groups

  const urlObj = new URL(url);
  const params = urlObj.searchParams;
  const region = params.get('region') || 'world';
  const gender = params.get('gender') || 'All';
  const show = params.get('show') || '100 persons';

  return {
    event,
    region,
    gender,
    show,
    rankingType,
  };
}

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

export default function Wrapper() {
  return (
    <WCAQueryClientProvider>
      <Rankings />
    </WCAQueryClientProvider>
  );
}

export function Rankings() {
  // Define the initial state
  const initialState = useMemo(() => ({
    event: undefined, region: 'world', gender: 'All', show: '',
  }), []);

  // Use the reducer
  const [filterState, dispatch] = useReducer(filterReducer, initialState);

  const filterActions = useMemo(
    () => ({
      setEvent: (event) => dispatch({ type: ActionTypes.SET_EVENT, payload: event }),
      setRegion: (region) => dispatch({ type: ActionTypes.SET_REGION, payload: region }),
      setGender: (gender) => dispatch({ type: ActionTypes.SET_GENDER, payload: gender }),
      setShow: (show) => dispatch({ type: ActionTypes.SET_SHOW, payload: show }),
    }),
    [dispatch],
  );

  const {
    event, region, gender, show,
  } = filterState;

  const { data, isFetching } = useQuery({
    queryKey: ['records', event, region, gender, show],
    queryFn: () => getRecords(event, region, gender, show),
  });

  useEffect(() => {
    window.history.replaceState(null, '', recordsUrl(event, region, gender, show));
  }, [event, region, gender, show]);

  if (isFetching) {
    return <Loading />;
  }

  return (
    <Container fluid>
      <ResultsFilter filterState={filterState} filterActions={filterActions} />
      <RecordsTable
        competitionsById={data.competitionsById}
        rows={data.rows}
        show={show}
      />
    </Container>
  );
}
