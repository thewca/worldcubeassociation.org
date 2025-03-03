import React from 'react';
import {
  Button, Header, List, Message,
} from 'semantic-ui-react';
import { useQuery } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import _ from 'lodash';
import I18n from '../../../../lib/i18n';
import getCronjobDetails from './api/getCronjobDetails';
import Loading from '../../../Requests/Loading';
import Errored from '../../../Requests/Errored';
import CronjobActions from './CronjobActions';

const CRONJOB_MESSAGE_TYPES = ['warning', 'info', 'error', 'success'];
const CRONJOB_MESSAGE_TYPES_MAP = _.keyBy(CRONJOB_MESSAGE_TYPES, (item) => item);

const timeSince = (timestamp) => (DateTime.fromISO(timestamp).toLocal().toRelative());

const timeDuration = (timestamp1, timestamp2) => (
  DateTime.fromISO(timestamp2).diff(DateTime.fromISO(timestamp1)).rescale().toHuman());

function getCronjobMessage(cronjobDetails) {
  if (cronjobDetails.reason_not_to_run) {
    return [
      cronjobDetails.reason_not_to_run,
      CRONJOB_MESSAGE_TYPES_MAP.warning,
    ];
  }

  if (cronjobDetails.scheduled) {
    return [
      `The job has been scheduled ${timeSince(cronjobDetails.enqueued_at)}, but it hasn't been picked up by the job handler yet. Please come back later.`,
      CRONJOB_MESSAGE_TYPES_MAP.info,
    ];
  }

  if (cronjobDetails.in_progress) {
    if (cronjobDetails.recently_errored) {
      return [
        `The job started to run but crashed :O The error message was: ${cronjobDetails.last_error_message}`,
        CRONJOB_MESSAGE_TYPES_MAP.error,
      ];
    }

    return [
      'The job is running. Thanks for checking =)',
      CRONJOB_MESSAGE_TYPES_MAP.info,
    ];
  }

  if (cronjobDetails.finished) {
    if (cronjobDetails.last_run_successful) {
      return [
        `Job was last completed ${timeSince(cronjobDetails.end_date)} and took ${timeDuration(cronjobDetails.start_date, cronjobDetails.end_date)}.`,
        CRONJOB_MESSAGE_TYPES_MAP.success,
      ];
    }
    return [
      `Job was last completed ${timeSince(cronjobDetails.end_date)} but it raised an error: ${cronjobDetails.last_error_message}. Note that our job handler has an automatic retry mechanism. The more times a job fails, the longer it waits to try again. If this problem persists for several hours, feel free to contact the Software Team.`,
      CRONJOB_MESSAGE_TYPES_MAP.error,
    ];
  }

  return [
    'Oh dear! The job has never been run!',
    CRONJOB_MESSAGE_TYPES_MAP.error,
  ];
}

export default function CronjobStatus({ cronjobClassName }) {
  const {
    data: cronjobDetails, isFetching, isError, refetch,
  } = useQuery({
    queryKey: ['cronjob-details', cronjobClassName],
    queryFn: () => getCronjobDetails({ cronjobClassName }),
  });

  if (isFetching) return <Loading />;
  if (isError) return <Errored />;

  const [cronjobMessage, cronjobMessageType] = getCronjobMessage(cronjobDetails);

  return (
    <>
      <Header>{`Controls for ${cronjobClassName}`}</Header>
      <Button primary onClick={refetch}>Refresh</Button>
      <Message info>
        Steps involved in this cronjob:
        <List bulleted>
          {I18n.tArray('cronjobs.compute_auxiliary_data.steps').map((step) => (
            <List.Item key={step}>{step}</List.Item>
          ))}
        </List>
      </Message>
      <Message
        warning={cronjobMessageType === CRONJOB_MESSAGE_TYPES_MAP.warning}
        info={cronjobMessageType === CRONJOB_MESSAGE_TYPES_MAP.info}
        error={cronjobMessageType === CRONJOB_MESSAGE_TYPES_MAP.error}
        success={cronjobMessageType === CRONJOB_MESSAGE_TYPES_MAP.success}
      >
        {cronjobMessage}
      </Message>
      <CronjobActions
        cronjobClassName={cronjobClassName}
        cronjobDetails={cronjobDetails}
      />
    </>
  );
}
