import React, { useContext } from 'react';
import SubSection from './SubSection';
import { InputCompetitions, InputString } from '../Inputs/FormInputs';
import FormContext from '../State/FormContext';
import SeriesComps from '../Tables/SeriesComps';

export default function Series() {
  const {
    formData: {
      series,
    },
  } = useContext(FormContext);

  if (!series) return <SeriesComps />;

  return (
    <SubSection section="series">
      <InputString id="id" />
      <InputString id="name" />
      <InputString id="shortName" />
      <InputCompetitions id="competitionIds" />
    </SubSection>
  );
}
