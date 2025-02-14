import React, { useEffect, useMemo, useReducer } from 'react';
import { Container } from 'semantic-ui-react';
import WCAQueryClientProvider from '../../../lib/providers/WCAQueryClientProvider';
import { recordsUrl } from '../../../lib/requests/routes.js.erb';
import ResultsFilter from '../ResultsFilter';
import RecordsTable from './RecordsTable';

const ActionTypes = {
  SET_EVENT: 'SET_EVENT',
  SET_REGION: 'SET_REGION',
  SET_GENDER: 'SET_GENDER',
  SET_SHOW: 'SET_SHOW',
};

function parseInitialStateFromUrl(url) {
  const urlObj = new URL(url);
  const params = urlObj.searchParams;
  const region = params.get('region') || 'world';
  const gender = params.get('gender') || 'All';
  const show = params.get('show') || 'mixed';
  const event = params.get('event_id');

  return {
    event,
    region,
    gender,
    show,
  };
}

function filterReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_EVENT:
      return { ...state, event: action.payload };
    case ActionTypes.SET_REGION:
      return { ...state, region: action.payload };
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
      <Records />
    </WCAQueryClientProvider>
  );
}

const SHOW_CATEGORIES = ['mixed', 'slim', 'separate', 'history', 'mixed history'];

export function Records() {
  const [filterState, dispatch] = useReducer(
    filterReducer,
    window.location.href,
    parseInitialStateFromUrl,
  );

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

  useEffect(() => {
    window.history.replaceState(null, '', recordsUrl(event, region, gender, show));
  }, [event, region, gender, show]);

  return (
    <Container fluid>
      <ResultsFilter
        filterState={filterState}
        filterActions={filterActions}
        clearEventIsAllowed
        showCategories={SHOW_CATEGORIES}
      />
      <RecordsTable filterState={filterState} />
    </Container>
  );
}
