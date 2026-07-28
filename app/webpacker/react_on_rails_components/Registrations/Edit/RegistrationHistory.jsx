import React from 'react';
import {
  Button, Header, Popup, Table,
} from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { getIsoDateString, getShortTimeString, getTimeWithSecondsString } from '../../../lib/utils/dates';
import { events } from '../../../lib/wca-data.js.erb';
import EventIcon from '../../wca/EventIcon';
import I18n from '../../../lib/i18n';
import getUsersInfo from '../api/user/post/getUserInfo';
import Loading from '../../Requests/Loading';
import { getRegistrationHistory } from '../api/registration/get/get_registrations';

export default function RegistrationHistory({ registrationId }) {
  const {
    isLoading: historyLoading,
    data: history,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['registration-history', registrationId],
    queryFn: () => getRegistrationHistory(registrationId),
  });

  const { data: userInfo, isLoading: userInfoLoading } = useQuery({
    queryKey: ['history-user', history],
    queryFn: () => getUsersInfo(_.uniq(history.flatMap((e) => (
      (e.actor_type === 'user' || e.actor_type === 'worker') ? Number(e.actor_id) : [])))),
    enabled: Boolean(history),
  });

  if (historyLoading || userInfoLoading) {
    return <Loading />;
  }

  return (
    <>
      <Header>
        {I18n.t('registrations.registration_history.title')}
        <Button floated="right" onClick={refetchHistory}>Refresh</Button>
      </Header>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>{I18n.t('competitions.registration_v2.list.timestamp')}</Table.HeaderCell>
            <Table.HeaderCell>{I18n.t('registrations.registration_history.changes')}</Table.HeaderCell>
            <Table.HeaderCell>{I18n.t('registrations.registration_history.acting_user')}</Table.HeaderCell>
            <Table.HeaderCell>{I18n.t('registrations.registration_history.action')}</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {history.map((entry) => (
            <Table.Row key={entry.timestamp}>
              <Table.Cell>
                <Popup
                  content={getShortTimeString(entry.timestamp)}
                  trigger={
                    <span>{`${getIsoDateString(entry.timestamp)} ${getTimeWithSecondsString(entry.timestamp)}`}</span>
                  }
                />
              </Table.Cell>
              <Table.Cell>
                {Object.entries(entry.changed_attributes).map(
                  ([k, v]) => (
                    <React.Fragment key={k}>
                      {k === 'event_ids' ? (
                        <span>
                          Toggled events
                          {' '}
                          <EventIcons ids={v} />
                        </span>
                      ) : (
                        <span>
                          Changed
                          {' '}
                          {k}
                          {' '}
                          to
                          {' '}
                          {v}
                        </span>
                      )}
                      <br />
                    </React.Fragment>
                  ),
                )}
              </Table.Cell>
              <Table.Cell>
                {
                  userInfo.find(
                    (c) => c.id === Number(entry.actor_id),
                  )?.name ?? entry.actor_id
                }
              </Table.Cell>
              <Table.Cell>{entry.action}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </>
  );
}

function EventIcons({ ids }) {
  return events.official.map((e) => (
    ids.includes(e.id) && <EventIcon key={e.id} id={e.id} style={{ cursor: 'unset' }} />
  ));
}
