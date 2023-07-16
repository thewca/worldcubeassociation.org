import React, { useContext } from 'react';
import SubSection from './SubSection';
import { InputBoolean, InputString } from '../Inputs/FormInputs';
import FormContext from '../State/FormContext';

export default function Website() {
  const websiteData = useContext(FormContext).formData.website;

  const usingExternalWebsite = websiteData && websiteData.generate_website !== 'true';
  const usingExternalRegistration = websiteData && websiteData.use_wca_registration !== 'true';
  return (
    <SubSection section="website">
      <InputBoolean id="generate_website" />
      {usingExternalWebsite && <InputString id="external_website" />}
      <InputBoolean id="use_wca_registration" />
      {usingExternalRegistration && <InputString id="external_registration_page" />}
      <InputBoolean id="use_wca_live_for_scoretaking" />
    </SubSection>
  );
}
