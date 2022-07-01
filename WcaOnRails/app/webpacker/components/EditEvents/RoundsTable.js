import React from 'react';

import events from '../../lib/wca-data/events.js.erb';
import I18n from '../../lib/i18n';

import {
  EditQualificationModal,
} from './Modals';
import Round from './Round';

export default function RoundsTable({ wcifEvent, disabled }) {
  const event = events.byId[wcifEvent.id];

  return (
    <div className="table-responsive">
      <table className="table table-condensed">
        <thead>
          <tr>
            <th>#</th>
            <th className="text-center">Format</th>
            <th className="text-center">Scramble Sets</th>
            {event.canChangeTimeLimit && (
              <th className="text-center">Time Limit</th>
            )}
            {event.canHaveCutoff && <th className="text-center">Cutoff</th>}
            <th className="text-center">To Advance</th>
          </tr>
        </thead>
        <tbody>
          {wcifEvent.rounds.map((wcifRound, index) => (
            <Round key={index} index={index} wcifEvent={wcifEvent} wcifRound={wcifRound} />
          ))}
        </tbody>
      </table>
      <h5>
        {I18n.t('competitions.events.qualification')}
        :
        {' '}
        <EditQualificationModal wcifEvent={wcifEvent} disabled={disabled} />
      </h5>
    </div>
  );
}
