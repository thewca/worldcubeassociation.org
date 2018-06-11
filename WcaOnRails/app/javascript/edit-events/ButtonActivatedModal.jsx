import React from 'react'
import cn from 'classnames'
import Modal from 'react-bootstrap/lib/Modal'
import Button from 'react-bootstrap/lib/Button'
import addEventListener from 'react-overlays/lib/utils/addEventListener';
import ownerDocument from 'react-overlays/lib/utils/ownerDocument';

export default class ButtonActivatedModal extends React.Component {
  constructor() {
    super();
    this.state = { showModal: false };
  }

  open = () => {
    this.setState({ showModal: true });
  }

  close = ({ skipUnsavedChangesCheck } = { skipUnsavedChangesCheck: false }) => {
    if(skipUnsavedChangesCheck || !this.props.hasUnsavedChanges() || confirm("Are you sure you want to discard your changes?")) {
      this.props.reset();
      this.setState({ showModal: false });
    }
  }

  render() {
    return (
      <button type="button" name={this.props.name} className={cn("btn", this.props.buttonClass)} onClick={this.open}>
        {this.props.buttonValue}
        <Modal show={this.state.showModal} onHide={this.close}>
          <form className={this.props.formClass}
                onSubmit={e => {
                  // Because we're rendering a modal inside of a modal, we're
                  // actually also rendering a form inside of a form. We don't
                  // want submitting this inner form to trigger a submit of the
                  // outer form, so we must stop event propagation here.
                  e.stopPropagation();
                  e.preventDefault();
                  this.props.onOk();
                }}
                onClick={e => {
                  // Prevent clicks on the modal from propagating up to the button, which
                  // would cause this modal to be marked as visible. This causes a race when
                  // clicking on something in the modal to close the modal: we set showModal to false,
                  // and then the button onClick listener immediately sets showModal to true.
                  e.stopPropagation();
                }}
          >
            {this.props.children}
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
