import React from 'react';
import { InputBoolean, InputString } from '../Inputs/FormInputs';
import ConditionalSection from './ConditionalSection';
import SubSection from '../../wca/FormProvider/SubSection';
import { useFormObject } from '../../wca/FormProvider/EditForm';

export default function Website() {
  const { website: websiteData } = useFormObject();

  const usingExternalWebsite = websiteData && !websiteData.generateWebsite;
  const usingExternalRegistration = websiteData && !websiteData.usesWcaRegistration;

  return (
    <SubSection section="website">
      <InputBoolean id="generateWebsite" />
      <ConditionalSection showIf={usingExternalWebsite}>
        <InputString id="externalWebsite" required={usingExternalWebsite} />
      </ConditionalSection>
      <InputBoolean id="usesWcaRegistration" />
      <ConditionalSection showIf={usingExternalRegistration}>
        <InputString id="externalRegistrationPage" />
      </ConditionalSection>
      <InputBoolean id="usesWcaLive" />
    </SubSection>
  );
}
