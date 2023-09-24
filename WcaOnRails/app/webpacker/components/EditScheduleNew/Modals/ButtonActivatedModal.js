/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import { Button, Form, Modal } from 'semantic-ui-react';
import { useConfirm } from '../../../lib/providers/ConfirmProvider';

/**
 * Shows a trigger that when activated, opens this modal.
 * @param {string} title - title of modal
 * @param {string} trigger - text to show in trigger. This gets wrapped in a button.
 * @param {JSX.Element} content - content of modal
 * @param {boolean} hasUnsavedChanges
 *  - if true, the modal will show a confirm dialog before closing.
 * @returns {React.ReactElement}
 */
export default function ButtonActivatedModal({
  title,
  trigger,
  triggerButtonProps = {},
  children,
  hasUnsavedChanges,
  disabled,
  tooltip,
  reset = () => null,
  onOk,
  ...props
}) {
  const [open, setOpen] = useState(false);
  const confirm = useConfirm();

  /**
   * Gets called either when you press escape or the "close" button
   */
  const onClose = () => {
    if (hasUnsavedChanges) {
      confirm({ content: 'Are you sure you want to discard your changes?' })
        .then(() => {
          reset();
          setOpen(false);
        });
    } else {
      setOpen(false);
    }
  };

  const handleSubmit = (e) => {
    // This prevents the form from submitting
    e.preventDefault();
    // This prevents a possible parent modal from also handling submit
    e.stopPropagation();
    onOk();
    setOpen(false);
  };

  // not entirely sure if this is necessary - can remove usage?
  const handleTriggerClick = (e) => {
    // For some reason the default behavior closes the parent and child modals.
    e.preventDefault();
  };

  const onOpen = () => {
    if (!disabled) {
      setOpen(true);
    }
  };

  // tool tips on disabled semantic ui buttons don't work... so wrap in span
  const Trigger = (
    <span data-tooltip={tooltip ?? undefined}>
      <Button
        basic
        compact
        onClick={handleTriggerClick}
        disabled={disabled}
        {...triggerButtonProps}
        size="small"
        className="editable-text-button"
      >
        {trigger}
      </Button>
    </span>
  );

  return (
    <Modal
      as={Form}
      onSubmit={handleSubmit}
      size="tiny"
      trigger={props.open ? undefined : Trigger}
      open={open}
      onOpen={onOpen}
      onClose={onClose}
      closeOnDimmerClick={false}
      closeOnDocumentClick={false}
      {...props}
    >
      <Modal.Header>{title}</Modal.Header>
      <Modal.Content>
        {children}
      </Modal.Content>
      <Modal.Actions>
        <Button color="orange" type="button" onClick={onClose}>Close</Button>
        <Button color="green" type="submit">Ok</Button>
      </Modal.Actions>
    </Modal>
  );
}
