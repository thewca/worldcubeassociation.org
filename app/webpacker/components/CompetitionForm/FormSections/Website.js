import React from 'react';
import { InputBoolean, InputString } from '../Inputs/FormInputs';
import { useStore } from '../../../lib/providers/StoreProvider';
import ConditionalSection from './ConditionalSection';
import SubSection from '../../wca/FormProvider/SubSection';

export default function Website() {
  const { competition: { website: websiteData } } = useStore();

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
