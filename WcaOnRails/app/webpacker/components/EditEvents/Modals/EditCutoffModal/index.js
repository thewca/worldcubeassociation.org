import React from 'react';
import { useStore } from '../../../../lib/providers/StoreProvider';
import { roundIdToString } from '../../../../lib/utils/wcif';
import ButtonActivatedModal from '../ButtonActivatedModal';
import { Show, Input } from './Cutoff';

export default function EditCutoffModal({ wcifEvent, wcifRound, cutoff }) {
  const { hasUnsavedChanges } = useStore();
  const disabled = false;

  console.log(11, wcifRound);

  const Title = (
    <span>
      Cutoff for
      {' '}
      {roundIdToString(wcifRound.id)}
    </span>
  );

  const handleOk = () => {

  };

  const reset = () => {

  };

  const handleChange = (ev, data) => {
    console.log(ev, data);
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
