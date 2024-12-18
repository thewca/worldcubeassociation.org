import React from 'react';
import I18n from '../../../lib/i18n';
import { isoMoneyToHumanReadable } from '../../../lib/helpers/money';

export default function OnTheSpotRegistrationRequirements({ competition }) {
  if (competition.on_the_spot_entry_fee_lowest_denomination) {
    return (
      I18n.t('competitions.competition_info.on_the_spot_registration_fee_html', {
        on_the_spot_base_entry_fee:
          isoMoneyToHumanReadable(
            competition.on_the_spot_base_entry_fee,
            competition.currency_code,
          ),
      }));
  }

  return I18n.t('competitions.competition_info.on_the_spot_registration_free');
}
