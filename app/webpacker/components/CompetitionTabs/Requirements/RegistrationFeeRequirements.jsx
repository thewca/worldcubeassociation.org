import React from 'react';
import I18n from '../../../lib/i18n';
import { isoMoneyToHumanReadable } from '../../../lib/helpers/money';

export default function RegistrationFeeRequirements({ competition }) {
  return (
    <>
      <p>
        {competition.base_entry_fee_lowest_denomination
          ? I18n.t('competitions.competition_info.entry_fee_is', {
            base_entry_fee:
              isoMoneyToHumanReadable(
                competition.base_entry_fee_lowest_denomination,
                competition.currency_code,
              ),
          })
          : I18n.t('competitions.competition_info.no_entry_fee')}
      </p>
      {competition.competition_events.map((event) => (event['has_fee?'] ? (
        <dl key={event.id}>
          <dt>{event.event.name}</dt>
          <dd>{isoMoneyToHumanReadable(event.fee)}</dd>
        </dl>
      ) : null))}
    </>
  );
}
