import React from 'react';
import I18n from '../../../lib/i18n';
import { InputString } from '../../wca/FormBuilder/input/FormInputs';
import { useStore } from '../../../lib/providers/StoreProvider';
import { competitionMaxShortNameLength } from '../../../lib/wca-data.js.erb';
import { useFormObject } from '../../wca/FormBuilder/provider/FormObjectProvider';

export default function NameDetails() {
  const { hasAnyRegistrations, isPersisted, isAdminView } = useStore();

  const { name, admin: { usesV2Registrations } } = useFormObject();

  const nameAlreadyShort = !name || name.length <= competitionMaxShortNameLength;
  const disableIdAndShortName = !isAdminView && nameAlreadyShort;

  // ID change on V1 is always possible, because we have control over the Foreign Keys.
  // Otherwise, only competitions without registrations can change their ID.
  const regSystemSupportsIdChange = !usesV2Registrations || !hasAnyRegistrations;

  return (
    <>
      {isPersisted && <InputString id="competitionId" disabled={disableIdAndShortName || !regSystemSupportsIdChange} />}
      <InputString id="name" required />
      {isPersisted && (
        <InputString
          id="shortName"
          hint={I18n.t('competitions.competition_form.hints.short_name', { short_name_limit: competitionMaxShortNameLength })}
          disabled={disableIdAndShortName}
        />
      )}
      <InputString id="nameReason" mdHint required />
    </>
  );
}
