import React, {
  useEffect, useMemo, useReducer,
} from 'react';
import { Container } from 'semantic-ui-react';
import RankingsTable from './RankingsTable';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';
import { rankingsUrl } from '../../../lib/requests/routes.js.erb';
import ResultsFilter from '../ResultsFilter';

const ActionTypes = {
  SET_EVENT: 'SET_EVENT',
  SET_REGION: 'SET_REGION',
  SET_RANKING_TYPE: 'SET_RANKING_TYPE',
  SET_GENDER: 'SET_GENDER',
  SET_SHOW: 'SET_SHOW',
};

function parseInitialStateFromUrl(url) {
  const urlPattern = /\/results\/rankings\/(\w+)\/(\w+)/; // Matches `/results/rankings/{event}/{rankingType}`
  const match = url.match(urlPattern);

  if (!match) {
    throw new Error('URL does not match the expected pattern.');
  }

  const [, event, rankingType] = match; // Extract event and rankingType from regex groups

  const urlObj = new URL(url);
  const params = urlObj.searchParams;
  const region = params.get('region') || 'world'; // Default to 'all' if not provided
  const gender = params.get('gender') || 'All'; // Default to 'all' if not provided
  const show = params.get('show') || '100 persons'; // Default to 'Persons' if not provided

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
      if (action.payload === '333mbf') {
        return { ...state, event: action.payload, rankingType: 'single' };
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

export default function Wrapper() {
  return (
    <WCAQueryClientProvider>
      <Rankings />
    </WCAQueryClientProvider>
  );
}

const SHOW_CATEGORIES = ['100 persons', '100 results', 'by region'];

export function Rankings() {
  const [filterState, dispatch] = useReducer(
    filterReducer,
    window.location.href,
    parseInitialStateFromUrl,
  );

  const filterActions = useMemo(
    () => ({
      setEvent: (event) => dispatch({ type: ActionTypes.SET_EVENT, payload: event }),
      setRegion: (region) => dispatch({ type: ActionTypes.SET_REGION, payload: region }),
      setRankingType:
        (rankingType) => dispatch({ type: ActionTypes.SET_RANKING_TYPE, payload: rankingType }),
      setGender: (gender) => dispatch({ type: ActionTypes.SET_GENDER, payload: gender }),
      setShow: (show) => dispatch({ type: ActionTypes.SET_SHOW, payload: show }),
    }),
    [dispatch],
  );

  const {
    event, region, rankingType, gender, show,
  } = filterState;

  useEffect(() => {
    window.history.replaceState(null, '', rankingsUrl(event, rankingType, region, gender, show));
  }, [event, region, rankingType, gender, show]);

  return (
    <Container fluid>
      <ResultsFilter
        filterState={filterState}
        filterActions={filterActions}
        showCategories={SHOW_CATEGORIES}
      />
      <RankingsTable filterState={filterState} />
    </Container>
  );
}
