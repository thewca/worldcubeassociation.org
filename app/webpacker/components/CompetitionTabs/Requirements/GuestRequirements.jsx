import React, { useMemo } from 'react';
import { List } from 'semantic-ui-react';
import I18n from '../../../lib/i18n';
import { isoMoneyToHumanReadable } from '../../../lib/helpers/money';

export default function GuestRequirements({ competition }) {
  const guestRequirement = useMemo(() => {
    if (competition.guests_entry_fee_lowest_denomination) {
      return (
        I18n.t('competitions.competition_info.guests_pay', {
          guests_base_fee:
            isoMoneyToHumanReadable(
              competition.guests_entry_fee_lowest_denomination,
              competition.currency_code,
            ),
        })
      );
    }

    if (competition['all_guests_allowed?']) {
      return (I18n.t('competitions.competition_info.guests_free.free'));
    }

    if (competition['some_guests_allowed?']) {
      return I18n.t('competitions.competition_info.guests_free.restricted');
    }
  });

  if (guestRequirement) {
    return (
      <List.Item>
        {guestRequirement}
      </List.Item>
    );
  }
}
