import React from 'react';
import SubSection from './SubSection';
import {
  InputBoolean,
  InputBooleanSelect,
  InputCurrencyAmount,
  InputDate,
  InputMarkdown,
  InputNumber, InputRadio, InputSelect,
} from '../Inputs/FormInputs';
import { useStore } from '../../../lib/providers/StoreProvider';
import ConditionalSection from './ConditionalSection';
import I18n from '../../../lib/i18n';

const guestsEnabledOptions = [
  {
    value: true,
    text: I18n.t('simple_form.options.competition.guests_enabled.true'),
  },
  {
    value: false,
    text: I18n.t('simple_form.options.competition.guests_enabled.false'),
  },
];

const guestMessageOptions = [
  {
    key: 'unclear',
    value: 'unclear',
    text: I18n.t('enums.competition.guest_entry_status.unclear'),
  },
  {
    key: 'free',
    value: 'free',
    text: I18n.t('enums.competition.guest_entry_status.free'),
  },
  {
    key: 'restricted',
    value: 'restricted',
    text: I18n.t('enums.competition.guest_entry_status.restricted'),
  },
];

export default function RegistrationDetails() {
  const { competition: { entryFees } } = useStore();

  const guestsGoFree = entryFees && entryFees.guestEntryFee === 0;
  const guestsRestricted = entryFees && guestsGoFree && entryFees.guestEntryStatus === 'restricted';

  return (
    <SubSection section="registration">
      <InputDate id="waitingListDeadlineDate" dateTime />
      <InputDate id="eventChangeDeadlineDate" dateTime />
      <InputBooleanSelect id="allowOnTheSpot" />
      <InputBooleanSelect id="allowSelfDeleteAfterAcceptance" />
      <InputBooleanSelect id="allowSelfEdits" />
      <InputRadio id="guestsEnabled" options={guestsEnabledOptions} />
      <ConditionalSection showIf={guestsGoFree}>
        <InputSelect id="guestEntryStatus" options={guestMessageOptions} />
      </ConditionalSection>
      <ConditionalSection showIf={guestsRestricted}>
        <InputNumber id="guestsPerRegistration" />
      </ConditionalSection>
      <InputMarkdown id="extraRequirements" />
      <InputBoolean id="forceComment" />
    </SubSection>
  );
}
