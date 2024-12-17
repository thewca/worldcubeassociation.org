import React from 'react';
import I18n from '../../../lib/i18n';
import { isoMoneyToHumanReadable } from '../../../lib/helpers/money';

export default function GuestRequirements({ competition }) {
  if (competition.guests_entry_fee_lowest_denomination) {
    return (
      <>
        {I18n.t('competitions.competition_info.guests_pay', {
          guests_base_fee:
            isoMoneyToHumanReadable(
              competition.guests_entry_fee_lowest_denomination,
              competition.currency_code,
            ),
        })}
      </>
    );
  }

  return (
    <>
      {competition['all_guests_allowed?'] ? (
        I18n.t('competitions.competition_info.guests_free.free')
      ) : competition['some_guests_allowed?'] && (
        I18n.t('competitions.competition_info.guests_free.restricted')
      )}
    </>
  );
}
