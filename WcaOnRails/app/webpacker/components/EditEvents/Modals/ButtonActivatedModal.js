import React, { useState } from 'react';
// import cn from 'classnames';
import { Button, Form, Modal } from 'semantic-ui-react';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';

/**
 * Shows a trigger that when activated, opens this modal.
 * @param {string} title - title of modal
 * @param {string} trigger - text to show in trigger. This gets wrapped in a button.
 * @param {JSX.Element} content - content of modal
 * @returns
 */
export default function ButtonActivatedModal({
  title, trigger, children, hasUnsavedChanges, reset = () => null, onOk,
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setOpen(false);
    onOk();
  };

  const Trigger = (
    <Button
      basic
      compact
      size="mini"
      onClick={() => setOpen(true)}
    >
      {trigger}
    </Button>
  );

  return (
    <Modal
      as={Form}
      onSubmit={handleSubmit}
      size="tiny"
      trigger={Trigger}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={close}
    >
      <Modal.Header>{title}</Modal.Header>
      <Modal.Content>
        {children}
      </Modal.Content>
      <Modal.Actions>
        <Button color="orange" onClick={close}>Close</Button>
        <Button color="green" type="submit">Ok</Button>
      </Modal.Actions>
    </Modal>
  );
}
