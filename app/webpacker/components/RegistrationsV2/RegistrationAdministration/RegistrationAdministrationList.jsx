import { useMutation, useQuery } from '@tanstack/react-query';
import React, {
  useMemo, useRef, useState,
} from 'react';
import {
  Accordion, Button, Checkbox, Divider, Form, Header, Icon, List, Modal, Segment, Sticky,
} from 'semantic-ui-react';
import { getAllRegistrations } from '../api/registration/get/get_registrations';
import RegistrationAdministrationSearch from './RegistrationAdministrationSearch';
import RegistrationActions from './RegistrationActions';
import { showMessage, showMessages } from '../Register/RegistrationMessage';
import { useDispatch } from '../../../lib/providers/StoreProvider';
import { autoAcceptPreferences } from '../../../lib/wca-data.js.erb';
import I18n from '../../../lib/i18n';
import Loading from '../../Requests/Loading';
import { bulkUpdateRegistrations } from '../api/registration/patch/update_registration';
import bulkAutoAccept from '../api/registration/patch/bulk_auto_accept';
import RegistrationAdministrationTable from './RegistrationsAdministrationTable';
import useCheckboxState from '../../../lib/hooks/useCheckboxState';
import useOrderedSet from '../../../lib/hooks/useOrderedSet';
import useStoredReducer from '../../../lib/hooks/useStoredReducer';
import {
  APPROVED_COLOR, APPROVED_ICON,
  CANCELLED_COLOR, CANCELLED_ICON,
  NON_COMPETING_COLOR,
  NON_COMPETING_ICON,
  partitionRegistrations,
  PENDING_COLOR, PENDING_ICON,
  REJECTED_COLOR, REJECTED_ICON,
  WAITLIST_COLOR, WAITLIST_ICON,
} from '../../../lib/utils/registrationAdmin';

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

const expandedColumnsReducer = (state, action) => {
  if (action.type === 'reset') {
    return initialExpandedColumns;
  }
  if (Object.keys(expandableColumns).includes(action.column)) {
    return { ...state, [action.column]: !state[action.column] };
  }
  return state;
};

export default function RegistrationAdministrationList({ competitionInfo }) {
  const [expandedColumns, dispatchExpandedColumns] = useStoredReducer(
    expandedColumnsReducer,
    initialExpandedColumns,
    'reg-admin-expanded-columns',
  );

  const [waitlistEditModeEnabled, setWaitlistEditModeEnabled] = useCheckboxState(false);

  const dispatchStore = useDispatch();

  const actionsRef = useRef();

  const {
    isLoading: isRegistrationsLoading,
    data: registrations,
    refetch,
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

  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);

  const { mutate: bulkAutoAcceptMutation, isPending: isAutoAccepting } = useMutation({
    mutationFn: bulkAutoAccept,
    onError: () => {
      dispatchStore(showMessage(
        'competitions.registration_v2.auto_accept.cant_bulk_auto_accept',
        'negative',
      ));
    },
    onSuccess: (data) => {
      if (Object.keys(data).length === 0) {
        dispatchStore(showMessage('competitions.registration_v2.auto_accept.nothing_to_accept', 'info'));
      } else {
        setModalData(data);
        setModalOpen(true);
        dispatchStore(showMessage('competitions.registration_v2.auto_accept.bulk_auto_accepted', 'positive'));
      }
      return refetch();
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
      await refetch();
    },
  });

  const partitionedRegistrations = useMemo(
    () => partitionRegistrations(registrations ?? []),
    [registrations],
  );
  const {
    waiting, accepted, cancelled, pending, rejected, nonCompeting,
  } = partitionedRegistrations;

  const selectedIds = useOrderedSet();
  const partitionedSelectedIds = useMemo(
    () => ({
      pending: selectedIds.asArray.filter((id) => pending.some((reg) => id === reg.user.id)),
      waiting: selectedIds.asArray.filter((id) => waiting.some((reg) => id === reg.user.id)),
      accepted: selectedIds.asArray.filter((id) => accepted.some((reg) => id === reg.user.id)),
      cancelled: selectedIds.asArray.filter((id) => cancelled.some((reg) => id === reg.user.id)),
      rejected: selectedIds.asArray.filter((id) => rejected.some((reg) => id === reg.user.id)),
      nonCompeting: selectedIds.asArray.filter(
        (id) => nonCompeting.some((reg) => id === reg.user.id),
      ),
    }),
    [selectedIds.asArray, pending, waiting, accepted, cancelled, rejected, nonCompeting],
  );

  // some sticky/floating bar somewhere with totals/info would be better
  // than putting this in the table headers which scroll out of sight
  const spotsRemaining = (competitionInfo.competitor_limit || Infinity) - accepted.length;
  const spotsRemainingText = I18n.t(
    'competitions.registration_v2.list.spots_remaining_plural',
    { count: spotsRemaining },
  );

  const handleOnDragEnd = useMemo(() => async (result) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;
    const waitingSorted = waiting
      .toSorted((a, b) => a.competing.waiting_list_position - b.competing.waiting_list_position);
    updateRegistrationMutation({
      competitionId: competitionInfo.id,
      payload: {
        competition_id: competitionInfo.id,
        requests: [{
          competition_id: competitionInfo.id,
          user_id: waitingSorted[result.source.index].user_id,
          competing: {
            waiting_list_position: waitingSorted[result.destination.index]
              .competing.waiting_list_position,
          },
        }],
      },
    }, {
      onSuccess: () => {
        // We need to get the info for all Competitors if you change the waiting list position
        refetch();
      },
    });
  }, [competitionInfo.id, refetch, updateRegistrationMutation, waiting]);

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
              selected={partitionedSelectedIds.pending}
              onSelect={selectedIds.add}
              onUnselect={selectedIds.remove}
              onToggle={selectedIds.toggle}
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
            <Header.Subheader>
              {I18n.t('competitions.registration_v2.list.waitlist.information')}
            </Header.Subheader>
            <Checkbox
              toggle
              checked={waitlistEditModeEnabled}
              onChange={setWaitlistEditModeEnabled}
              label={I18n.t('competitions.registration_v2.list.edit_waiting_list')}
            />
            <RegistrationAdministrationTable
              columnsExpanded={expandedColumns}
              selected={partitionedSelectedIds.waiting}
              onSelect={selectedIds.add}
              onUnselect={selectedIds.remove}
              onToggle={selectedIds.toggle}
              initialSortColumn="waiting_list_position"
              competitionInfo={competitionInfo}
              registrations={waiting.toSorted(
                (a, b) => a.competing.waiting_list_position - b.competing.waiting_list_position,
              )}
              handleOnDragEnd={handleOnDragEnd}
              draggable={waitlistEditModeEnabled}
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
            selected={partitionedSelectedIds.accepted}
            onSelect={selectedIds.add}
            onUnselect={selectedIds.remove}
            onToggle={selectedIds.toggle}
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
              selected={partitionedSelectedIds.cancelled}
              onSelect={selectedIds.add}
              onUnselect={selectedIds.remove}
              onToggle={selectedIds.toggle}
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
              selected={partitionedSelectedIds.rejected}
              onSelect={selectedIds.add}
              onUnselect={selectedIds.remove}
              onToggle={selectedIds.toggle}
              competitionInfo={competitionInfo}
              color={REJECTED_COLOR}
            />
          </>
        ),
      },
    },
    nonCompeting.length > 0 && {
      key: 'nonCompeting',
      title: {
        content: (
          <SectionToggle
            icon={NON_COMPETING_ICON}
            title={I18n.t('competitions.registration_v2.list.non_competing.title')}
            inParens={nonCompeting.length}
            color={NON_COMPETING_COLOR}
          />
        ),
      },
      content: {
        content: (
          <>
            <Header.Subheader>
              {I18n.t('competitions.registration_v2.list.non_competing.information')}
            </Header.Subheader>
            <RegistrationAdministrationTable
              columnsExpanded={expandedColumns}
              registrations={nonCompeting}
              selected={partitionedSelectedIds.nonCompeting}
              onSelect={selectedIds.add}
              onUnselect={selectedIds.remove}
              onToggle={selectedIds.toggle}
              competitionInfo={competitionInfo}
              color={NON_COMPETING_COLOR}
            />
          </>
        ),
      },
    },
  ].filter(Boolean);

  const nonEmptyTableIndices = [
    ['pending', pending],
    ['waitlist', waiting],
    ['accepted', accepted],
    ['cancelled', cancelled],
    ['rejected', rejected],
    ['nonCompeting', nonCompeting],
  ].filter(
    ([, list]) => list.length > 0,
  ).map(
    ([key]) => panels.findIndex((panel) => panel.key === key),
  );

  return (
    <Segment loading={isMutating || isAutoAccepting}>
      {competitionInfo.auto_accept_preference === autoAcceptPreferences.bulk && (
        <>
          <Button
            disabled={isAutoAccepting}
            color="green"
            onClick={() => bulkAutoAcceptMutation(competitionInfo.id)}
          >
            <Icon name="check" />
            {' '}
            {I18n.t('competitions.registration_v2.auto_accept.bulk_auto_accept')}
          </Button>

          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            size="small"
          >
            <Modal.Header>Bulk Auto-Accept Result</Modal.Header>
            <Modal.Content>
              {modalData !== null ? (
                <List bulleted>
                  {Object.entries(modalData).map(([key, value]) => (
                    <List.Item key={key}>
                      {registrations.find(
                        (registration) => registration.id === Number(key),
                      )?.user.name}
                      {' - '}
                      <b>Succeeded</b>
                      {': '}
                      {value.succeeded.toString()}
                      {', '}
                      <b>Info</b>
                      {': '}
                      {value.info}
                    </List.Item>
                  ))}
                </List>
              ) : (
                <p>No data available.</p>
              )}
            </Modal.Content>
            <Modal.Actions>
              <Button onClick={() => setModalOpen(false)}>Close</Button>
            </Modal.Actions>
          </Modal>
        </>
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
              onChange={() => dispatchExpandedColumns({ column: id })}
            />
          ))}
        </Form.Group>
      </Form>

      <Divider />

      <RegistrationAdministrationSearch
        partitionedRegistrations={partitionedRegistrations}
        usingPayments={competitionInfo['using_payment_integrations?']}
        currencyCode={competitionInfo.currency_code}
      />

      <Divider />

      <div ref={actionsRef}>
        <Sticky context={actionsRef} offset={20}>
          <RegistrationActions
            partitionedSelectedIds={partitionedSelectedIds}
            refresh={selectedIds.clear}
            registrations={registrations}
            spotsRemaining={spotsRemaining}
            competitionInfo={competitionInfo}
            updateRegistrationMutation={updateRegistrationMutation}
          />
        </Sticky>

        <Divider />

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
