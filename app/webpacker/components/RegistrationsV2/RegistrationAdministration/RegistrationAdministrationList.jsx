import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useReducer, useRef } from 'react';
import {
  Checkbox, Flag, Form, Header, Icon, Popup, Sticky, Table,
} from 'semantic-ui-react';
import { DateTime } from 'luxon';
import { getAllRegistrations } from '../api/registration/get/get_registrations';
import { getShortDateString, getShortTimeString } from '../../../lib/utils/dates';
import createSortReducer from '../reducers/sortReducer';
import RegistrationActions from './RegistrationActions';
import { setMessage } from '../Register/RegistrationMessage';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import i18n from '../../../lib/i18n';
import Loading from '../../Requests/Loading';
import EventIcon from '../../wca/EventIcon';
import useWithUserData from '../hooks/useWithUserData';
import { editRegistrationUrl, editPersonUrl, personUrl } from '../../../lib/requests/routes.js.erb';

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
  region: 'Region',
  events: 'Events',
  comments: 'Comment & Note',
  email: 'Email',
};
const initialExpandedColumns = {
  dob: false,
  region: false,
  events: false,
  comments: true,
  email: false,
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

// Semantic Table only allows truncating _all_ columns in a table in
// single line fixed mode. As we only want to truncate the comment/admin notes
// this function is used to manually truncate the columns.
// TODO: We could fix this by building our own table component here
const truncateComment = (comment) => (comment?.length > 12 ? `${comment.slice(0, 12)}...` : comment);

export default function RegistrationAdministrationList({ competitionInfo }) {
  const [expandedColumns, dispatchColumns] = useReducer(
    columnReducer,
    initialExpandedColumns,
  );

  const dispatchStore = useDispatch();

  const actionsRef = useRef();

  const [state, dispatchSort] = useReducer(sortReducer, {
    sortColumn: competitionInfo['using_payment_integrations?']
      ? 'paid_on'
      : 'paid_on_with_registered_on_fallback',
    sortDirection: undefined,
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
    'competitions.registration_v2.list.spots_remaining',
    { spots: spotsRemaining },
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

  return isRegistrationsLoading || infoLoading ? (
    <Loading />
  ) : (
    <>
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
            refresh={async () => {
              await refetch();
              dispatch({ type: 'clear-selected' });
            }}
            registrations={registrations}
            spotsRemaining={spotsRemaining}
            userEmailMap={userEmailMap}
            competitionInfo={competitionInfo}
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
          {competitionInfo.competitor_limit && `; ${spotsRemainingText}`}
          )
        </Header>
        <RegistrationAdministrationTable
          columnsExpanded={expandedColumns}
          registrations={waiting}
          selected={partitionedSelected.waiting}
          select={select}
          unselect={unselect}
          competition_id={competitionInfo.id}
          changeSortColumn={changeSortColumn}
          sortDirection={sortDirection}
          sortColumn={sortColumn}
          competitionInfo={competitionInfo}
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
    </>
  );
}

function RegistrationAdministrationTable({
  columnsExpanded,
  registrations,
  selected,
  select,
  unselect,
  sortDirection,
  sortColumn,
  changeSortColumn,
  competitionInfo,
}) {
  const handleHeaderCheck = (_, data) => {
    if (data.checked) {
      select(registrations.map(({ user }) => user.id));
    } else {
      unselect(registrations.map(({ user }) => user.id));
    }
  };

  return (
    <div>
      <Table sortable striped textAlign="left">
        <TableHeader
          columnsExpanded={columnsExpanded}
          showCheckbox={registrations.length > 0}
          isChecked={registrations.length === selected.length}
          onCheckboxChanged={handleHeaderCheck}
          sortDirection={sortDirection}
          sortColumn={sortColumn}
          changeSortColumn={changeSortColumn}
          competitionInfo={competitionInfo}
        />

        <Table.Body>
          {registrations.length > 0 ? (
            registrations.map((registration) => {
              const { id } = registration.user;
              return (
                <TableRow
                  key={id}
                  competitionInfo={competitionInfo}
                  columnsExpanded={columnsExpanded}
                  registration={registration}
                  isSelected={selected.includes(id)}
                  onCheckboxChange={(_, data) => {
                    if (data.checked) {
                      select([id]);
                    } else {
                      unselect([id]);
                    }
                  }}
                />
              );
            })
          ) : (
            <Table.Row>
              <Table.Cell colSpan={6}>
                {i18n.t('competitions.registration_v2.list.empty')}
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    </div>
  );
}

function TableHeader({
  columnsExpanded,
  showCheckbox,
  isChecked,
  onCheckboxChanged,
  sortDirection,
  sortColumn,
  changeSortColumn,
  competitionInfo,
}) {
  const { dob, events, comments } = columnsExpanded;

  return (
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>
          {showCheckbox && (
            <Checkbox checked={isChecked} onChange={onCheckboxChanged} />
          )}
        </Table.HeaderCell>
        <Table.HeaderCell />
        <Table.HeaderCell
          sorted={sortColumn === 'wca_id' ? sortDirection : undefined}
          onClick={() => changeSortColumn('wca_id')}
        >
          {i18n.t('common.user.wca_id')}
        </Table.HeaderCell>
        <Table.HeaderCell
          sorted={sortColumn === 'name' ? sortDirection : undefined}
          onClick={() => changeSortColumn('name')}
        >
          {i18n.t('delegates_page.table.name')}
        </Table.HeaderCell>
        {dob && (
          <Table.HeaderCell
            sorted={sortColumn === 'dob' ? sortDirection : undefined}
            onClick={() => changeSortColumn('dob')}
          >
            {i18n.t('activerecord.attributes.user.dob')}
          </Table.HeaderCell>
        )}
        <Table.HeaderCell
          sorted={sortColumn === 'country' ? sortDirection : undefined}
          onClick={() => changeSortColumn('country')}
        >
          {i18n.t('common.user.representing')}
        </Table.HeaderCell>
        <Table.HeaderCell
          sorted={sortColumn === 'registered_on' ? sortDirection : undefined}
          onClick={() => changeSortColumn('registered_on')}
        >
          {i18n.t('registrations.list.registered.without_stripe')}
        </Table.HeaderCell>
        {competitionInfo['using_payment_integrations?'] && (
          <>
            <Table.HeaderCell>Payment Status</Table.HeaderCell>
            <Table.HeaderCell
              sorted={sortColumn === 'paid_on_with_registered_on_fallback' ? sortDirection : undefined}
              onClick={() => changeSortColumn('paid_on_with_registered_on_fallback')}
            >
              {i18n.t('registrations.list.registered.with_stripe')}
            </Table.HeaderCell>
          </>
        )}
        {events ? (
          competitionInfo.event_ids.map((eventId) => (
            <Table.HeaderCell key={`event-${eventId}`}>
              <EventIcon id={eventId} className="selected" />
            </Table.HeaderCell>
          ))
        ) : (
          <Table.HeaderCell
            sorted={sortColumn === 'events' ? sortDirection : undefined}
            onClick={() => changeSortColumn('events')}
          >
            {i18n.t('competitions.competition_info.events')}
          </Table.HeaderCell>
        )}
        <Table.HeaderCell
          sorted={sortColumn === 'guests' ? sortDirection : undefined}
          onClick={() => changeSortColumn('guests')}
        >
          {i18n.t(
            'competitions.competition_form.labels.registration.guests_enabled',
          )}
        </Table.HeaderCell>
        {comments && (
          <>
            <Table.HeaderCell
              sorted={sortColumn === 'comment' ? sortDirection : undefined}
              onClick={() => changeSortColumn('comment')}
            >
              {i18n.t('activerecord.attributes.registration.comments')}
            </Table.HeaderCell>
            <Table.HeaderCell>
              {i18n.t('activerecord.attributes.registration.administrative_notes')}
            </Table.HeaderCell>
          </>
        )}
        <Table.HeaderCell>{i18n.t('registrations.list.email')}</Table.HeaderCell>
      </Table.Row>
    </Table.Header>
  );
}

function TableRow({
  columnsExpanded,
  registration,
  isSelected,
  onCheckboxChange,
  competitionInfo,
}) {
  const {
    dob, region, events, comments, email,
  } = columnsExpanded;
  const {
    id, wca_id: wcaId, name, country,
  } = registration.user;
  const {
    registered_on: registeredOn, event_ids: eventIds, comment, admin_comment: adminComment,
  } = registration.competing;
  const { dob: dateOfBirth, email: emailAddress } = registration;
  const { payment_status: paymentStatus, updated_at: updatedAt } = registration.payment;

  const copyEmail = () => {
    navigator.clipboard.writeText(emailAddress);
    setMessage('Copied email address to clipboard.', 'positive');
  };

  return (
    <Table.Row key={id} active={isSelected}>
      <Table.Cell>
        <Checkbox onChange={onCheckboxChange} checked={isSelected} />
      </Table.Cell>

      <Table.Cell>
        <a href={editRegistrationUrl(id, competitionInfo.id)}>
          {i18n.t('registrations.list.edit')}
        </a>
      </Table.Cell>

      <Table.Cell>
        {wcaId ? (
          <a href={personUrl(wcaId)}>{wcaId}</a>
        ) : (
          <a href={editPersonUrl(id)}>
            <Icon name="edit" />
            {i18n.t('users.edit.profile')}
          </a>
        )}
      </Table.Cell>

      <Table.Cell>{name}</Table.Cell>

      {dob && <Table.Cell>{dateOfBirth}</Table.Cell>}

      <Table.Cell>
        {region ? (
          <>
            <Flag name={country.iso2.toLowerCase()} />
            {region && country.name}
          </>
        ) : (
          <Popup
            content={country.name}
            trigger={(
              <span>
                <Flag name={country.iso2.toLowerCase()} />
              </span>
            )}
          />
        )}
      </Table.Cell>

      <Table.Cell>
        <Popup
          content={getShortTimeString(registeredOn)}
          trigger={<span>{getShortDateString(registeredOn)}</span>}
        />
      </Table.Cell>

      {competitionInfo['using_payment_integrations?'] && (
        <>
          <Table.Cell>{paymentStatus ?? i18n.t('registrations.list.not_paid')}</Table.Cell>
          <Table.Cell>
            {updatedAt && (
              <Popup
                content={getShortTimeString(updatedAt)}
                trigger={<span>{getShortDateString(updatedAt)}</span>}
              />
            )}
          </Table.Cell>
        </>
      )}

      {events ? (
        competitionInfo.event_ids.map((eventId) => (
          <Table.Cell key={`event-${eventId}`}>
            {eventIds.includes(eventId) && (
              <EventIcon id={eventId} size="1x" selected />
            )}
          </Table.Cell>
        ))
      ) : (
        <Table.Cell>
          <Popup
            content={eventIds.map((eventId) => (
              <EventIcon key={eventId} id={eventId} className="selected" />
            ))}
            trigger={<span>{eventIds.length}</span>}
          />
        </Table.Cell>
      )}

      <Table.Cell>{registration.guests}</Table.Cell>

      {comments && (
        <>
          <Table.Cell>
            <Popup
              content={comment}
              trigger={<span>{truncateComment(comment)}</span>}
            />
          </Table.Cell>

          <Table.Cell>
            <Popup
              content={adminComment}
              trigger={<span>{truncateComment(adminComment)}</span>}
            />
          </Table.Cell>
        </>
      )}

      <Table.Cell>
        <a href={`mailto:${emailAddress}`}>
          {email ? (
            emailAddress
          ) : (
            <Popup
              content={emailAddress}
              trigger={(
                <span>
                  <Icon name="mail" />
                </span>
              )}
            />
          )}
        </a>
        {' '}
        <Icon link onClick={copyEmail} name="copy" title={i18n.t('competitions.registration_v2.update.email_copy')} />
      </Table.Cell>
    </Table.Row>
  );
}
