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
import ResultsFilter from '../ResultsFilter';
import SlimRecordTable from './SlimRecordsTable';
import SeparateRecordsTable from './SeparateRecordsTable';

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
  const show = params.get('show') || '100 persons';
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
      <Rankings />
    </WCAQueryClientProvider>
  );
}

const SHOW_CATEGORIES = ['mixed', 'slim', 'separate', 'history', 'mixed history'];

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
      <ResultsFilter
        filterState={filterState}
        filterActions={filterActions}
        isRecords
        showCategories={SHOW_CATEGORIES}
      />
      <TableWrapper competitionsById={data.competitionsById} rows={data.rows} show={show} />
    </Container>
  );
}

function TableWrapper({ competitionsById, rows, show }) {
  if (show === 'slim') {
    return (
      <SlimRecordTable
        rows={rows[0]}
      />
    );
  }
  if (show === 'separate') {
    return (
      <SeparateRecordsTable
        competitionsById={competitionsById}
        rows={rows}
      />
    );
  }
  return (
    <RecordsTable
      competitionsById={competitionsById}
      rows={rows}
      show={show}
    />
  );
}
