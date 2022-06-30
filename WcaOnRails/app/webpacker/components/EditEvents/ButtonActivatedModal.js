import React from 'react';
import cn from 'classnames';
import Modal from 'react-bootstrap/lib/Modal';
import Button from 'react-bootstrap/lib/Button';

export default class ButtonActivatedModal extends React.Component {
  constructor() {
    super();
    this.state = { showModal: false };
  }

  open = () => {
    this.setState({ showModal: true });
  };

  close = ({ skipUnsavedChangesCheck } = { skipUnsavedChangesCheck: false }) => {
    const { hasUnsavedChanges, reset } = this.props;
    // eslint-disable-next-line no-restricted-globals
    if (skipUnsavedChangesCheck || !hasUnsavedChanges() || confirm('Are you sure you want to discard your changes?')) {
      reset();
      this.setState({ showModal: false });
    }
  };

  render() {
    const {
      name, buttonClass, disabled, buttonValue, formClass, onOk, children,
    } = this.props;
    const { showModal } = this.state;

    return (
      <button type="button" name={name} className={cn('btn', buttonClass)} onClick={this.open} disabled={disabled}>
        {buttonValue}
        <Modal show={showModal} onHide={this.close}>
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
      </button>
    );
  }
}
