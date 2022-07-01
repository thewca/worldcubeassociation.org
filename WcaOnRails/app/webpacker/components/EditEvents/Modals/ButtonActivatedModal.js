import React, { useState } from 'react';
// import cn from 'classnames';
import { Modal } from 'semantic-ui-react';
import Button from 'react-bootstrap/lib/Button';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';

/**
 * Shows a trigger that when activated, opens this modal.
 * @param {string} title - title of modal
 * @returns
 */
export default function ButtonActivatedModal({
  title, trigger, children, hasUnsavedChanges, reset, onOk,
}) {
  const [open, setOpen] = useState(false);
  const confirm = useConfirm();

  /**
   * Gets called either when you press escape or the "close" button
   */
  const close = ({ skipUnsavedChangesCheck = false }) => {
    // eslint-disable-next-line no-restricted-globals
    if (skipUnsavedChangesCheck || !hasUnsavedChanges()) {
      confirm({ content: 'Are you sure you want to discard your changes?' })
        .then(() => {
          reset();
          setOpen(false);
        });
    }

    setOpen(false);
  };

  const handleSubmit = () => {
    setOpen(false);
    onOk();
  };

  return (
    <Modal trigger={trigger} open={open} onOpen={() => setOpen(true)} onClose={close}>
      <form onSubmit={handleSubmit}>
        <Modal.Header>{title}</Modal.Header>
        <Modal.Content>
          {children}
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={close} bsStyle="warning">Close</Button>
          <Button type="submit" bsStyle="success">Ok</Button>
        </Modal.Actions>
      </form>
    </Modal>
  );
}
