import React from 'react';
import SubSection from './SubSection';
import {
  InputBoolean,
  InputBooleanSelect,
  InputDate,
  InputMarkdown,
  InputNumber, InputRadio, InputSelect,
} from '../Inputs/FormInputs';
import { useStore } from '../../../lib/providers/StoreProvider';
import ConditionalSection from './ConditionalSection';
import I18n from '../../../lib/i18n';

const guestsEnabledOptions = [].map((bool) => ({
  value: bool,
  text: I18n.t(`competitions.competition_form.choices.guests_enabled.${bool.toString()}`),
}));

const guestMessageOptions = ['unclear', 'free', 'restricted'].map((status) => ({
  key: status,
  value: status,
  text: I18n.t(`competitions.competition_form.choices.registration.guest_entry_status.${status}`),
}));

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
