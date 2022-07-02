import React, { useState } from 'react';
import { roundIdToString } from '../../../../lib/utils/wcif';
import ButtonActivatedModal from '../ButtonActivatedModal';
import { Show, Input } from './Cutoff';

export default function EditCutoffModal({ wcifEvent, wcifRound, cutoff }) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const disabled = false;

  // console.log(11, hasUnsavedChanges);

  const Title = (
    <span>
      Cutoff for
      {' '}
      {roundIdToString(wcifRound.id)}
    </span>
  );

  const handleOk = () => {
    setHasUnsavedChanges(false);
  };

  const reset = () => {
    setHasUnsavedChanges(false);
  };

  const handleChange = (ev, data) => {
    console.log(ev, data);
    setHasUnsavedChanges(true);
  };

  return (
    <ButtonActivatedModal
      trigger={
        <Show wcifRound={wcifRound} wcifEvent={wcifEvent} />
      }
      title={Title}
      buttonClass="btn-default btn-xs"
      formClass="form-horizontal"
      onOk={handleOk}
      reset={reset}
      hasUnsavedChanges={hasUnsavedChanges}
      disabled={disabled}
    >
      <Input
        value={cutoff}
        wcifEvent={wcifEvent}
        onChange={handleChange}
        autoFocus
      />
    </ButtonActivatedModal>
  );
}
