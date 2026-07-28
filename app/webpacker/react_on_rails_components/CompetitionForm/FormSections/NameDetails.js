import React from 'react';
import I18n from '../../../lib/i18n';
import { InputString } from '../../wca/FormBuilder/input/FormInputs';
import { useStore } from '../../../lib/providers/StoreProvider';
import { competitionMaxShortNameLength } from '../../../lib/wca-data.js.erb';
import { useFormObject } from '../../wca/FormBuilder/provider/FormObjectProvider';

export default function NameDetails() {
  const { isPersisted, isAdminView } = useStore();

  const { name } = useFormObject();

  const nameAlreadyShort = !name || name.length <= competitionMaxShortNameLength;
  const disableIdAndShortName = !isAdminView && nameAlreadyShort;

  return (
    <>
      {isPersisted && <InputString id="competitionId" disabled={disableIdAndShortName} />}
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
