import React from 'react';
import SubSection from './SubSection';
import { InputBoolean, InputString } from '../Inputs/FormInputs';
import { useStore } from '../../../lib/providers/StoreProvider';
import ConditionalSection from './ConditionalSection';

export default function Website() {
  const { competition: { website: websiteData } } = useStore();

  const usingExternalWebsite = websiteData && !websiteData.generate_website;
  const usingExternalRegistration = websiteData && !websiteData.use_wca_registration;
  return (
    <SubSection section="website">
      <InputBoolean id="generate_website" />
      <ConditionalSection showIf={usingExternalWebsite}>
        <InputString id="external_website" />
      </ConditionalSection>
      <InputBoolean id="use_wca_registration" />
      <ConditionalSection showIf={usingExternalRegistration}>
        <InputString id="external_registration_page" />
      </ConditionalSection>
      <InputBoolean id="use_wca_live_for_scoretaking" />
    </SubSection>
  );
}
