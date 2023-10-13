import React from 'react';
import { Form } from 'semantic-ui-react';
import {
  InputDate,
} from '../Inputs/FormInputs';
import { useStore } from '../../../lib/providers/StoreProvider';
import I18n from '../../../lib/i18n';

function daysUntil(date) {
  if (!date) return null;

  const timeDelta = new Date(date).getTime() - new Date().getTime();
  const days = Math.trunc(timeDelta / (1000 * 3600 * 24));
  const daysText = I18n.t('datetime.distance_in_words.x_days', { count: Math.abs(days) });

  if (days >= 0) {
    return I18n.t('competitions.time_until_competition.competition_in', { n_days: daysText });
  }

  return I18n.t('competitions.time_until_competition.competition_was', { n_days: daysText });
}

export default function CompDates() {
  const { competition: { startDate } } = useStore();

  return (
    <Form.Group widths="equal">
      <InputDate id="startDate" hint={daysUntil(startDate)} />
      <InputDate id="endDate" />
    </Form.Group>
  );
}
