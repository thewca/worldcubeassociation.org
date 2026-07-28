import React from 'react';
import { InputBoolean, InputSelect, InputString } from '../../wca/FormBuilder/input/FormInputs';
import ConditionalSection from './ConditionalSection';
import SubSection from '../../wca/FormBuilder/SubSection';
import { useFormObject } from '../../wca/FormBuilder/provider/FormObjectProvider';
import I18n from '../../../lib/i18n';

const ilrChoiceText = I18n.t('competitions.competition_form.choices.website.scoretaking_software.internal');
const dualRoundsHint = I18n.t('competitions.competition_form.hints.website.scoretaking_software', { choice_ilr: ilrChoiceText });

const scoretakingSoftwareOptions = ['external', 'wca_live', 'internal'].map((software) => ({
  key: software,
  value: software,
  text: I18n.t(`competitions.competition_form.choices.website.scoretaking_software.${software}`),
}));

export default function Website() {
  const { website: websiteData } = useFormObject();

  const usingExternalWebsite = websiteData && !websiteData.generateWebsite;
  const usingExternalRegistration = websiteData && !websiteData.usesWcaRegistration;

  return (
    <SubSection section="website">
      <InputBoolean id="generateWebsite" />
      <ConditionalSection showIf={usingExternalWebsite}>
        <InputString id="externalWebsite" required={usingExternalWebsite} ignoreDisabled />
      </ConditionalSection>
      <InputBoolean id="usesWcaRegistration" />
      <ConditionalSection showIf={usingExternalRegistration}>
        <InputString id="externalRegistrationPage" />
      </ConditionalSection>
      <InputSelect id="scoretakingSoftware" options={scoretakingSoftwareOptions} hint={dualRoundsHint} ignoreDisabled />
    </SubSection>
  );
}
