import React, { useState } from 'react';
import cn from 'classnames';
import Modal from 'semantic-ui-react';
import Button from 'react-bootstrap/lib/Button';

/**
 * Shows a trigger that when activated, opens this modal.
 * @param {*} param0 
 * @returns 
 */
export default function ButtonActivatedModal({
  name, buttonClass, disabled, buttonValue, formClass, onOk, children, hasUnsavedChanges
}) {
  const [open, setOpen] = useState(false);

  const close = ({ skipUnsavedChangesCheck = false }) => {
    const { hasUnsavedChanges, reset } = this.props;
    // eslint-disable-next-line no-restricted-globals
    if (skipUnsavedChangesCheck || !hasUnsavedChanges() || confirm('Are you sure you want to discard your changes?')) {
      reset();
      setOpen(false);
    }
  };

  return (
    <Modal trigger={buttonValue} open={open} onOpen={() => setOpen(true)} onClose={close}>
      <form
        className={formClass}
        onSubmit={(e) => {
          // Because we're rendering a modal inside of a modal, we're
          // actually also rendering a form inside of a form. We don't
          // want submitting this inner form to trigger a submit of the
          // outer form, so we must stop event propagation here.
          e.stopPropagation();
          e.preventDefault();
          onOk();
        }}
        onClick={(e) => {
          // Prevent clicks on the modal from propagating up to the button, which
          // would cause this modal to be marked as visible. This causes a race when
          // clicking on something in the modal to close the modal: we set showModal to false,
          // and then the button onClick listener immediately sets showModal to true.
          e.stopPropagation();
        }}
      >
        {children}
        <Modal.Footer>
          <Button onClick={this.close} bsStyle="warning">Close</Button>
          <Button type="submit" bsStyle="success">Ok</Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
