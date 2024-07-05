import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, {
  useMemo, useReducer, useRef,
} from 'react';
import {
  Checkbox, Form, Header, Segment, Sticky,
} from 'semantic-ui-react';
import { DateTime } from 'luxon';
import { getAllRegistrations } from '../api/registration/get/get_registrations';
import createSortReducer from '../reducers/sortReducer';
import RegistrationActions from './RegistrationActions';
import { setMessage } from '../Register/RegistrationMessage';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import i18n from '../../../lib/i18n';
import Loading from '../../Requests/Loading';
import useWithUserData from '../hooks/useWithUserData';
import { bulkUpdateRegistrations } from '../api/registration/patch/update_registration';
import RegistrationAdministrationTable from './RegistrationsAdministrationTable';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';

const selectedReducer = (state, action) => {
  let newState = [...state];

  const { type, attendee, attendees } = action;
  const idList = attendees || [attendee];

  switch (type) {
    case 'add':
      idList.forEach((id) => {
        // Make sure no one adds an attendee twice
        if (!newState.includes(id)) newState.push(id);
      });
      break;

    case 'remove':
      newState = newState.filter((id) => !idList.includes(id));
      break;

    case 'clear-selected':
      return [];

    default:
      throw new Error('Unknown action.');
  }

  return newState;
};

const sortReducer = createSortReducer([
  'name',
  'wca_id',
  'country',
  'registered_on',
  'events',
  'guests',
  'paid_on',
  'comment',
  'dob',
]);

const partitionRegistrations = (registrations) => registrations.reduce(
  (result, registration) => {
    switch (registration.competing.registration_status) {
      case 'pending':
        result.pending.push(registration);
        break;
      case 'waiting_list':
        result.waiting.push(registration);
        break;
      case 'accepted':
        result.accepted.push(registration);
        break;
      case 'cancelled':
        result.cancelled.push(registration);
        break;
      default:
        break;
    }
    return result;
  },
  {
    pending: [], waiting: [], accepted: [], cancelled: [],
  },
);

const expandableColumns = {
  dob: 'Date of Birth',
  region: 'Region Name',
  events: 'Events',
  comments: 'Comment & Note',
  email: 'Email',
  timestamp: 'Timestamp',
};
const initialExpandedColumns = {
  dob: false,
  region: false,
  events: false,
  comments: true,
  email: false,
  timestamp: false,
};

const columnReducer = (state, action) => {
  if (action.type === 'reset') {
    return initialExpandedColumns;
  }
  if (Object.keys(expandableColumns).includes(action.column)) {
    return { ...state, [action.column]: !state[action.column] };
  }
  return state;
};

export default function RegistrationAdministrationList({ competitionInfo }) {
  const [expandedColumns, dispatchColumns] = useReducer(
    columnReducer,
    initialExpandedColumns,
  );

  const queryClient = useQueryClient();

  const [editable, setEditable] = useCheckboxState(false);

  const dispatchStore = useDispatch();

  const actionsRef = useRef();

  const [state, dispatchSort] = useReducer(sortReducer, {
    sortColumn: competitionInfo['using_payment_integrations?']
      ? 'paid_on_with_registered_on_fallback'
      : 'registered_on',
    sortDirection: 'descending',
  });
  const { sortColumn, sortDirection } = state;
  const changeSortColumn = (name) => dispatchSort({ type: 'CHANGE_SORT', sortColumn: name });

  const {
    isLoading: isRegistrationsLoading,
    data: registrations,
    refetch,
  } = useQuery({
    queryKey: ['registrations-admin', competitionInfo.id],
    queryFn: () => getAllRegistrations(competitionInfo.id),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    refetchOnMount: 'always',
    retry: false,
    onError: (err) => {
      const { errorCode } = err;
      dispatchStore(setMessage(
        errorCode
          ? `competitions.registration_v2.errors.${errorCode}`
          : 'registrations.flash.failed',
        'negative',
      ));
    },
  });

  const {
    isLoading: infoLoading,
    data: registrationsWithUser,
  } = useWithUserData(registrations ?? []);

  const { mutate: updateRegistrationMutation, isPending: isMutating } = useMutation({
    mutationFn: bulkUpdateRegistrations,
    onError: (data) => {
      const { error } = data.json;
      dispatchStore(setMessage(
        error
          ? Object.values(error).map((err) => `competitions.registration_v2.errors.${err}`)
          : 'registrations.flash.failed',
        'negative',
      ));
    },
    onSuccess: (data) => {
      const { updated_registrations: updatedRegistrations } = data;
      const updated = registrations.map(
        (r) => (updatedRegistrations[r.user_id]
          ? { ...updatedRegistrations[r.user_id], payment: r.payment }
          : r),
      );
      queryClient.setQueryData(['registrations-admin', competitionInfo.id], updated);
    },
  });

  const sortedRegistrationsWithUser = useMemo(() => {
    if (registrationsWithUser) {
      const sorted = registrationsWithUser.toSorted((a, b) => {
        switch (sortColumn) {
          case 'name':
            return a.user.name.localeCompare(b.user.name);
          case 'wca_id':
            return a.user.wca_id.localeCompare(b.user.wca_id);
          case 'country':
            return a.user.country.name.localeCompare(b.user.country.name);
          case 'events':
            return a.competing.event_ids.length - b.competing.event_ids.length;
          case 'guests':
            return a.guests - b.guests;
          case 'dob':
            return a.user.dob - b.user.dob;
          case 'comment':
            return a.competing.comment.localeCompare(b.competing.comment);
          case 'registered_on':
            return DateTime.fromISO(a.competing.registered_on).toMillis()
              - DateTime.fromISO(b.competing.registered_on).toMillis();
          case 'paid_on_with_registered_on_fallback':
          {
            if (a.payment && b.payment) {
              return DateTime.fromISO(a.payment.updated_at).toMillis()
                - DateTime.fromISO(b.payment.updated_at).toMillis();
            }
            if (a.payment && !b.payment) {
              return 1;
            }
            if (!a.payment && b.payment) {
              return -1;
            }
            return DateTime.fromISO(a.competing.registered_on).toMillis()
              - DateTime.fromISO(b.competing.registered_on).toMillis();
          }
          case 'waiting_list_position':
            return a.competing.waiting_list_position - b.competing.waiting_list_position;
          default:
            return 0;
        }
      });
      if (sortDirection === 'descending') {
        return sorted.toReversed();
      }
      return sorted;
    }
    return [];
  }, [registrationsWithUser, sortColumn, sortDirection]);

  const {
    waiting, accepted, cancelled, pending,
  } = useMemo(
    () => partitionRegistrations(sortedRegistrationsWithUser ?? []),
    [sortedRegistrationsWithUser],
  );

  const [selected, dispatch] = useReducer(selectedReducer, []);
  const partitionedSelected = useMemo(
    () => ({
      pending: selected.filter((id) => pending.some((reg) => id === reg.user.id)),
      waiting: selected.filter((id) => waiting.some((reg) => id === reg.user.id)),
      accepted: selected.filter((id) => accepted.some((reg) => id === reg.user.id)),
      cancelled: selected.filter((id) => cancelled.some((reg) => id === reg.user.id)),
    }),
    [selected, pending, waiting, accepted, cancelled],
  );

  const select = (attendees) => dispatch({ type: 'add', attendees });
  const unselect = (attendees) => dispatch({ type: 'remove', attendees });

  // some sticky/floating bar somewhere with totals/info would be better
  // than putting this in the table headers which scroll out of sight
  const spotsRemaining = (competitionInfo.competitor_limit ?? Infinity) - accepted.length;
  const spotsRemainingText = i18n.t(
    'competitions.registration_v2.list.spots_remaining_plural',
    { count: spotsRemaining },
  );

  const userEmailMap = useMemo(
    () => Object.fromEntries(
      (registrationsWithUser ?? []).map((registration) => [
        registration.user.id,
        registration.email,
      ]),
    ),
    [registrationsWithUser],
  );

  const handleOnDragEnd = async (result) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    updateRegistrationMutation({
      competition_id: competitionInfo.id,
      requests: [{
        user_id: waiting[result.source.index].user_id,
        competing: {
          waiting_list_position: waiting[result.destination.index].competing.waiting_list_position,
        },
      }],
    }, {
      onSuccess: () => {
        // We need to get the information for all Competitors if you change the waiting list position
        refetch();
      },
    });
  };

  return isRegistrationsLoading || infoLoading ? (
    <Loading />
  ) : (
    <Segment loading={isMutating} style={{ overflowX: 'scroll' }}>
      <Form>
        <Form.Group widths="equal">
          {Object.entries(expandableColumns).map(([id, name]) => (
            <Form.Field key={id}>
              <Checkbox
                name={id}
                label={name}
                toggle
                checked={expandedColumns[id]}
                onChange={() => dispatchColumns({ column: id })}
              />
            </Form.Field>
          ))}
        </Form.Group>
      </Form>

      <div ref={actionsRef}>
        <Sticky context={actionsRef} offset={20}>
          <RegistrationActions
            partitionedSelected={partitionedSelected}
            refresh={() => {
              dispatch({ type: 'clear-selected' });
            }}
            registrations={registrations}
            spotsRemaining={spotsRemaining}
            userEmailMap={userEmailMap}
            competitionInfo={competitionInfo}
            updateRegistrationMutation={updateRegistrationMutation}
          />
        </Sticky>

        <Header>
          Pending registrations (
          {pending.length}
          )
        </Header>
        <RegistrationAdministrationTable
          columnsExpanded={expandedColumns}
          registrations={pending}
          selected={partitionedSelected.pending}
          select={select}
          unselect={unselect}
          competition_id={competitionInfo.id}
          changeSortColumn={changeSortColumn}
          sortDirection={sortDirection}
          sortColumn={sortColumn}
          competitionInfo={competitionInfo}
        />

        <Header>
          {i18n.t('registrations.list.approved_registrations')}
          {' '}
          (
          {accepted.length}
          {competitionInfo.competitor_limit && (
            <>
              {`/${competitionInfo.competitor_limit}; `}
              {spotsRemainingText}
            </>
          )}
          )
        </Header>
        <RegistrationAdministrationTable
          columnsExpanded={expandedColumns}
          registrations={accepted}
          selected={partitionedSelected.accepted}
          select={select}
          unselect={unselect}
          competition_id={competitionInfo.id}
          changeSortColumn={changeSortColumn}
          sortDirection={sortDirection}
          sortColumn={sortColumn}
          competitionInfo={competitionInfo}
        />

        <Header>
          {i18n.t('registrations.list.waiting_list')}
          {' '}
          (
          {waiting.length}
          )
        </Header>

        <Checkbox toggle value={editable} onChange={setEditable} label="Enable Waiting List Edit Mode" />

        <RegistrationAdministrationTable
          columnsExpanded={expandedColumns}
          selected={partitionedSelected.waiting}
          select={select}
          unselect={unselect}
          competition_id={competitionInfo.id}
          changeSortColumn={changeSortColumn}
          sortDirection={sortDirection}
          sortColumn={sortColumn}
          competitionInfo={competitionInfo}
          registrations={waiting.toSorted(
            (a, b) => a.competing.waiting_list_position - b.competing.waiting_list_position,
          )}
          handleOnDragEnd={handleOnDragEnd}
          draggable={editable}
          sortable={false}
        />

        <Header>
          {i18n.t('registrations.list.deleted_registrations')}
          {' '}
          (
          {cancelled.length}
          )
        </Header>
        <RegistrationAdministrationTable
          columnsExpanded={expandedColumns}
          registrations={cancelled}
          selected={partitionedSelected.cancelled}
          select={select}
          unselect={unselect}
          competition_id={competitionInfo.id}
          changeSortColumn={changeSortColumn}
          sortDirection={sortDirection}
          sortColumn={sortColumn}
          competitionInfo={competitionInfo}
        />
      </div>
    </Segment>
  );
}
