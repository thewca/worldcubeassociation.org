import React, {
  useMemo, useReducer, useRef,
} from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Accordion, Button, Icon, Checkbox, Form, Header, Segment, Sticky,
} from 'semantic-ui-react';
import { DateTime } from 'luxon';
import Loading from '../../Requests/Loading';
import { getAllRegistrations } from '../api/registration/get/get_registrations';
import { bulkUpdateRegistrations } from '../api/registration/patch/update_registration';
import { showMessage, showMessages } from '../Register/RegistrationMessage';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import disableAutoAccept from '../api/registration/patch/auto_accept';
import createSortReducer from '../reducers/sortReducer';
import RegistrationActions from './RegistrationActions';
import I18n from '../../../lib/i18n';
import RegistrationAdministrationTable from './RegistrationsAdministrationTable';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';
import { countries, WCA_EVENT_IDS } from '../../../lib/wca-data.js.erb';
import useOrderedSet from '../../../lib/hooks/useOrderedSet';
import {
  APPROVED_COLOR, APPROVED_ICON,
  CANCELLED_COLOR, CANCELLED_ICON,
  PENDING_COLOR, PENDING_ICON,
  REJECTED_COLOR, REJECTED_ICON,
  WAITLIST_COLOR, WAITLIST_ICON,
} from '../../../lib/utils/registrationAdmin';

const sortReducer = createSortReducer([
  'name',
  'wca_id',
  'country',
  'paid_on_with_registered_on_fallback',
  'registered_on',
  'amount',
  'events',
  'guests',
  'paid_on',
  'comment',
  'dob',
  ...WCA_EVENT_IDS,
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
      case 'rejected':
        result.rejected.push(registration);
        break;
      default:
        break;
    }
    return result;
  },
  {
    pending: [], waiting: [], accepted: [], cancelled: [], rejected: [],
  },
);

const expandableColumns = {
  dob: I18n.t('activerecord.attributes.user.dob'),
  region: I18n.t('activerecord.attributes.user.region'),
  events: I18n.t('competitions.show.events'),
  comments: I18n.t('competitions.registration_v2.list.comment_and_note'),
  email: I18n.t('activerecord.attributes.user.email'),
  timestamp: I18n.t('competitions.registration_v2.list.timestamp'),
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

export default function RegistrationAdministrationList({
  competitionInfo,
  refetchCompetitionInfo,
}) {
  const dispatchStore = useDispatch();

  const [expandedColumns, dispatchColumns] = useReducer(
    columnReducer,
    initialExpandedColumns,
  );

  const [editable, setEditable] = useCheckboxState(false);

  const actionsRef = useRef();

  const [state, dispatchSort] = useReducer(sortReducer, {
    sortColumn: competitionInfo['using_payment_integrations?']
      ? 'paid_on_with_registered_on_fallback'
      : 'registered_on',
    sortDirection: 'ascending',
  });
  const { sortColumn, sortDirection } = state;
  const changeSortColumn = (name) => dispatchSort({ type: 'CHANGE_SORT', sortColumn: name });

  const {
    isLoading: isRegistrationsLoading,
    data: registrations,
    refetch: refetchRegistrations,
  } = useQuery({
    queryKey: ['registrations-admin', competitionInfo.id],
    queryFn: () => getAllRegistrations(competitionInfo),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    refetchOnMount: 'always',
    retry: false,
    onError: (err) => {
      const { errorCode } = err;
      dispatchStore(showMessage(
        errorCode
          ? `competitions.registration_v2.errors.${errorCode}`
          : 'registrations.flash.failed',
        'negative',
      ));
    },
  });

  const { mutate: disableAutoAcceptMutation, isPending: isUpdating } = useMutation({
    mutationFn: disableAutoAccept,
    onError: () => {
      dispatchStore(showMessage(
        'competitions.registration_v2.auto_accept.cant_disable',
        'negative',
      ));
    },
    onSuccess: async () => {
      dispatchStore(showMessage('competitions.registration_v2.auto_accept.disabled', 'positive'));
      await refetchCompetitionInfo();
    },
  });

  const { mutate: updateRegistrationMutation, isPending: isMutating } = useMutation({
    mutationFn: bulkUpdateRegistrations,
    onError: (data) => {
      const { error } = data.json;
      dispatchStore(showMessages(
        Object.values(error).map((err) => (
          {
            key: `competitions.registration_v2.errors.${err}`,
            type: 'negative',
          }
        )),
      ));
    },
    onSuccess: async () => {
      // If multiple organizers approve people at the same time,
      // or if registrations are still coming in while organizers approve them
      // we want the data to be refreshed. Optimal solution would be subscribing to changes
      // via graphql/websockets, but we aren't there yet
      await refetchRegistrations();
    },
  });

  const sortedRegistrationsWithUser = useMemo(() => {
    if (registrations) {
      const sorted = registrations.toSorted((a, b) => {
        switch (sortColumn) {
          case 'name':
            return a.user.name.localeCompare(b.user.name);

          case 'wca_id': {
            const aHasAccount = a.user.wca_id !== null;
            const bHasAccount = b.user.wca_id !== null;
            if (aHasAccount && !bHasAccount) {
              return 1;
            }
            if (!aHasAccount && bHasAccount) {
              return -1;
            }
            if (!aHasAccount && !bHasAccount) {
              return a.user.name.localeCompare(b.user.name);
            }
            return a.user.wca_id.localeCompare(b.user.wca_id);
          }

          case 'country':
            return countries.byIso2[a.user.country.iso2].name
              .localeCompare(countries.byIso2[b.user.country.iso2].name);

          case 'events':
            return a.competing.event_ids.length - b.competing.event_ids.length;

          case 'guests':
            return a.guests - b.guests;

          case 'dob':
            return DateTime.fromISO(a.user.dob).toMillis()
              - DateTime.fromISO(b.user.dob).toMillis();

          case 'comment':
            return a.competing.comment.localeCompare(b.competing.comment);

          case 'registered_on':
            return DateTime.fromISO(a.competing.registered_on).toMillis()
              - DateTime.fromISO(b.competing.registered_on).toMillis();

          case 'paid_on_with_registered_on_fallback': {
            const hasAPaid = a.payment?.has_paid;
            const hasBPaid = b.payment?.has_paid;

            if (hasAPaid && hasBPaid) {
              return DateTime.fromISO(a.payment.updated_at).toMillis()
                - DateTime.fromISO(b.payment.updated_at).toMillis();
            }
            if (hasAPaid && !hasBPaid) {
              return -1;
            }
            if (!hasAPaid && hasBPaid) {
              return 1;
            }
            return DateTime.fromISO(a.competing.registered_on).toMillis()
              - DateTime.fromISO(b.competing.registered_on).toMillis();
          }

          case 'amount':
            return a.payment.payment_amount_iso - b.payment.payment_amount_iso;

          case 'waiting_list_position':
            return a.competing.waiting_list_position - b.competing.waiting_list_position;

          default: {
            if (WCA_EVENT_IDS.includes(sortColumn)) {
              const aHasEvent = a.competing.event_ids.includes(sortColumn);
              const bHasEvent = b.competing.event_ids.includes(sortColumn);

              return Number(bHasEvent) - Number(aHasEvent);
            }

            return 0;
          }
        }
      });
      if (sortDirection === 'descending') {
        return sorted.toReversed();
      }
      return sorted;
    }
    return [];
  }, [registrations, sortColumn, sortDirection]);

  const {
    waiting, accepted, cancelled, pending, rejected,
  } = useMemo(
    () => partitionRegistrations(sortedRegistrationsWithUser ?? []),
    [sortedRegistrationsWithUser],
  );

  const selectedIds = useOrderedSet();
  const partitionedSelected = useMemo(
    () => ({
      pending: selectedIds.asArray.filter((id) => pending.some((reg) => id === reg.user.id)),
      waiting: selectedIds.asArray.filter((id) => waiting.some((reg) => id === reg.user.id)),
      accepted: selectedIds.asArray.filter((id) => accepted.some((reg) => id === reg.user.id)),
      cancelled: selectedIds.asArray.filter((id) => cancelled.some((reg) => id === reg.user.id)),
      rejected: selectedIds.asArray.filter((id) => rejected.some((reg) => id === reg.user.id)),
    }),
    [selectedIds.asArray, pending, waiting, accepted, cancelled, rejected],
  );

  // some sticky/floating bar somewhere with totals/info would be better
  // than putting this in the table headers which scroll out of sight
  const spotsRemaining = (competitionInfo.competitor_limit || Infinity) - accepted.length;
  const spotsRemainingText = I18n.t(
    'competitions.registration_v2.list.spots_remaining_plural',
    { count: spotsRemaining },
  );

  const userEmailMap = useMemo(
    () => Object.fromEntries(
      (registrations ?? []).map((registration) => [
        registration.user.id,
        registration.user.email,
      ]),
    ),
    [registrations],
  );
  const handleOnDragEnd = useMemo(() => async (result) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;
    const waitingSorted = waiting
      .toSorted((a, b) => a.competing.waiting_list_position - b.competing.waiting_list_position);
    updateRegistrationMutation({
      competition_id: competitionInfo.id,
      requests: [{
        competition_id: competitionInfo.id,
        user_id: waitingSorted[result.source.index].user_id,
        competing: {
          waiting_list_position: waitingSorted[result.destination.index]
            .competing.waiting_list_position,
        },
      }],
    }, {
      onSuccess: () => {
        // We need to get the info for all Competitors if you change the waiting list position
        refetchRegistrations();
      },
    });
  }, [competitionInfo.id, refetchRegistrations, updateRegistrationMutation, waiting]);

  if (isRegistrationsLoading) {
    return <Loading />;
  }

  const panels = [
    {
      key: 'pending',
      title: {
        content: (
          <SectionToggle
            icon={PENDING_ICON}
            title={I18n.t('competitions.registration_v2.list.pending.title')}
            inParens={pending.length}
            color={PENDING_COLOR}
          />
        ),
      },
      content: {
        content: (
          <>
            <Header.Subheader>
              {I18n.t('competitions.registration_v2.list.pending.information')}
            </Header.Subheader>
            <RegistrationAdministrationTable
              columnsExpanded={expandedColumns}
              registrations={pending}
              selected={partitionedSelected.pending}
              onSelect={selectedIds.add}
              onUnselect={selectedIds.remove}
              onToggle={selectedIds.toggle}
              competition_id={competitionInfo.id}
              changeSortColumn={changeSortColumn}
              sortDirection={sortDirection}
              sortColumn={sortColumn}
              competitionInfo={competitionInfo}
              color={PENDING_COLOR}
              distinguishPaidUnpaid
            />
          </>
        ),
      },
    },
    {
      key: 'waitlist',
      title: {
        content: (
          <SectionToggle
            icon={WAITLIST_ICON}
            title={I18n.t('competitions.registration_v2.list.waitlist.title')}
            inParens={waiting.length}
            color={WAITLIST_COLOR}
          />
        ),
      },
      content: {
        content: (
          <>
            <Checkbox
              toggle
              value={editable}
              onChange={setEditable}
              label={I18n.t('competitions.registration_v2.list.edit_waiting_list')}
            />
            <RegistrationAdministrationTable
              columnsExpanded={expandedColumns}
              selected={partitionedSelected.waiting}
              onSelect={selectedIds.add}
              onUnselect={selectedIds.remove}
              onToggle={selectedIds.toggle}
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
              withPosition
              color={WAITLIST_COLOR}
            />
          </>
        ),
      },
    },
    {
      key: 'accepted',
      title: {
        content: (
          <SectionToggle
            icon={APPROVED_ICON}
            title={I18n.t('competitions.registration_v2.list.approved.title')}
            inParens={
              `${
                accepted.length
              }${
                spotsRemaining !== Infinity
                  ? `/${competitionInfo.competitor_limit}, ${spotsRemainingText}`
                  : ''
              }`
            }
            color={APPROVED_COLOR}
          />
        ),
      },
      content: {
        content: (
          <RegistrationAdministrationTable
            columnsExpanded={expandedColumns}
            registrations={accepted}
            selected={partitionedSelected.accepted}
            onSelect={selectedIds.add}
            onUnselect={selectedIds.remove}
            onToggle={selectedIds.toggle}
            competition_id={competitionInfo.id}
            changeSortColumn={changeSortColumn}
            sortDirection={sortDirection}
            sortColumn={sortColumn}
            competitionInfo={competitionInfo}
            color={APPROVED_COLOR}
          />
        ),
      },
    },
    {
      key: 'cancelled',
      title: {
        content: (
          <SectionToggle
            icon={CANCELLED_ICON}
            title={I18n.t('competitions.registration_v2.list.cancelled.title')}
            inParens={cancelled.length}
            color={CANCELLED_COLOR}
          />
        ),
      },
      content: {
        content: (
          <>
            <Header.Subheader>
              {I18n.t('competitions.registration_v2.list.cancelled.information')}
            </Header.Subheader>
            <RegistrationAdministrationTable
              columnsExpanded={expandedColumns}
              registrations={cancelled}
              selected={partitionedSelected.cancelled}
              onSelect={selectedIds.add}
              onUnselect={selectedIds.remove}
              onToggle={selectedIds.toggle}
              competition_id={competitionInfo.id}
              changeSortColumn={changeSortColumn}
              sortDirection={sortDirection}
              sortColumn={sortColumn}
              competitionInfo={competitionInfo}
              color={CANCELLED_COLOR}
            />
          </>
        ),
      },
    },
    {
      key: 'rejected',
      title: {
        content: (
          <SectionToggle
            icon={REJECTED_ICON}
            title={I18n.t('competitions.registration_v2.list.rejected.title')}
            inParens={rejected.length}
            color={REJECTED_COLOR}
          />
        ),
      },
      content: {
        content: (
          <>
            <Header.Subheader>
              {I18n.t('competitions.registration_v2.list.rejected.information')}
            </Header.Subheader>
            <RegistrationAdministrationTable
              columnsExpanded={expandedColumns}
              registrations={rejected}
              selected={partitionedSelected.rejected}
              onSelect={selectedIds.add}
              onUnselect={selectedIds.remove}
              onToggle={selectedIds.toggle}
              competition_id={competitionInfo.id}
              changeSortColumn={changeSortColumn}
              sortDirection={sortDirection}
              sortColumn={sortColumn}
              competitionInfo={competitionInfo}
              color={REJECTED_COLOR}
            />
          </>
        ),
      },
    },
    // TODO: Either add non competing registrations here on in a separate staff tab
  ];

  const nonEmptyTableIndices = [
    ['pending', pending],
    ['waitlist', waiting],
    ['accepted', accepted],
    ['cancelled', cancelled],
    ['rejected', rejected],
  ].filter(
    ([, list]) => list.length > 0,
  ).map(
    ([key]) => panels.findIndex((panel) => panel.key === key),
  );

  return (
    <Segment loading={isMutating} style={{ overflowX: 'scroll' }}>
      { competitionInfo.auto_accept_registrations && (
        <Button
          disabled={isUpdating}
          color="red"
          onClick={() => disableAutoAcceptMutation(competitionInfo.id)}
        >
          <Icon name="ban" />
          {' '}
          {I18n.t('competitions.registration_v2.auto_accept.disable')}
        </Button>
      )}

      <Form>
        <Form.Group unstackable widths="2">
          {Object.entries(expandableColumns).map(([id, name]) => (
            <Form.Checkbox
              key={id}
              name={id}
              label={name}
              toggle
              checked={expandedColumns[id]}
              onChange={() => dispatchColumns({ column: id })}
            />
          ))}
        </Form.Group>
      </Form>

      <div ref={actionsRef}>
        <Sticky context={actionsRef} offset={20}>
          <RegistrationActions
            partitionedSelected={partitionedSelected}
            refresh={selectedIds.clear}
            registrations={registrations}
            spotsRemaining={spotsRemaining}
            userEmailMap={userEmailMap}
            competitionInfo={competitionInfo}
            updateRegistrationMutation={updateRegistrationMutation}
          />
        </Sticky>

        <Accordion
          defaultActiveIndex={nonEmptyTableIndices}
          panels={panels}
          exclusive={false}
          fluid
        />

        {/* i18n-tasks-use t('registrations.list.non_competing') */}
      </div>
    </Segment>
  );
}

function SectionToggle({
  icon, title, inParens, color,
}) {
  return (
    <Header as="span" size="large">
      <Icon name={icon} color={color} />
      {`${title} (${inParens})`}
    </Header>
  );
}
