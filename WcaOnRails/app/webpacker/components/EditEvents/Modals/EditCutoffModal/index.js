import React from 'react';
import ButtonActivatedModal from '../ButtonActivatedModal';
import { Show, Title, Input } from './Cutoff';

export default function EditCutoffModal ({wcifEvent}) {
  return (
    <ButtonActivatedModal
      buttonValue={
        <Show value={this.getSavedValue()} wcifEvent={wcifEvent} />
      }
      name={attribute}
      buttonClass="btn-default btn-xs"
      formClass="form-horizontal"
      onOk={this.onOk}
      reset={this.reset}
      hasUnsavedChanges={this.hasUnsavedChanges}
      ref={(c) => (this._modal = c)}
      disabled={disabled}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <Title wcifEvent={wcifEvent} />
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Input
          value={this.state.value}
          wcifEvent={wcifEvent}
          onChange={this.onChange}
          autoFocus
        />
      </Modal.Body>
    </ButtonActivatedModal>
  );
}
