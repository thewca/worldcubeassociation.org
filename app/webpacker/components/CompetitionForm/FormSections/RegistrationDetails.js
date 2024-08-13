import React from 'react';
import {
  InputBoolean,
  InputBooleanSelect,
  InputDate,
  InputMarkdown,
  InputNumber,
  InputRadio,
  InputSelect,
} from '../../wca/FormBuilder/input/FormInputs';
import ConditionalSection from './ConditionalSection';
import I18n from '../../../lib/i18n';
import SubSection from '../../wca/FormBuilder/SubSection';
import { useFormObject } from '../../wca/FormBuilder/provider/FormObjectProvider';

const guestsEnabledOptions = [true, false].map((bool) => ({
  value: bool,
  text: I18n.t(`competitions.competition_form.choices.guests_enabled.${bool.toString()}`),
}));

const guestMessageOptions = ['unclear', 'free', 'restricted'].map((status) => ({
  key: status,
  value: status,
  text: I18n.t(`competitions.competition_form.choices.registration.guest_entry_status.${status}`),
}));

export default function RegistrationDetails() {
  const { entryFees, registration } = useFormObject();

  const guestsGoFree = entryFees?.guestEntryFee === 0;
  const guestsRestricted = guestsGoFree && registration?.guestEntryStatus === 'restricted';

  return (
    <SubSection section="registration">
      <InputDate id="waitingListDeadlineDate" dateTime required />
      <InputDate id="eventChangeDeadlineDate" dateTime required />
      <InputBooleanSelect id="allowOnTheSpot" required />
      <InputBooleanSelect id="allowSelfDeleteAfterAcceptance" required />
      <InputBooleanSelect id="allowSelfEdits" required overrideEnabled />
      <InputRadio id="guestsEnabled" options={guestsEnabledOptions} />
      <ConditionalSection showIf={guestsGoFree}>
        <InputSelect id="guestEntryStatus" options={guestMessageOptions} required={guestsGoFree} />
      </ConditionalSection>
      <ConditionalSection showIf={guestsRestricted}>
        <InputNumber id="guestsPerRegistration" required={guestsRestricted} />
      </ConditionalSection>
      <InputMarkdown id="extraRequirements" />
      <InputBoolean id="forceComment" overrideEnabled />
    </SubSection>
  );
}
