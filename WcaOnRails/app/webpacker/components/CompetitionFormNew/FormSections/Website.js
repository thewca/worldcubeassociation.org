import React, { useContext } from 'react';
import SubSection from './SubSection';
import { InputBoolean, InputString } from '../Inputs/FormInputs';
import FormContext from '../State/FormContext';

export default function Website() {
  const { formData } = useContext(FormContext);

  const usingExternalWebsite = formData.website && formData.website.generate_website === 'false';
  return (
    <SubSection section="website">
      <InputBoolean id="generate_website" />
      {usingExternalWebsite && <InputString id="external_website" />}
    </SubSection>
  );
}
