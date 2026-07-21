import React from 'react';
import { DateTime } from 'luxon';
import I18n from '../../../../lib/i18n';

export default function ResultsPostedMessage({ ticketDetails }) {
  const {
    ticket: {
      metadata: {
        competition: {
          results_posted_at: resultsPostedAt,
          posted_user: postedUser,
        },
      },
    },
  } = ticketDetails;
  return (
    <>
      {I18n.t('competitions.results_posted_by_html', {
        poster_name: postedUser.name,
        date_time: DateTime.fromISO(resultsPostedAt).toLocaleString(DateTime.DATETIME_FULL),
      })}
    </>
  );
}
