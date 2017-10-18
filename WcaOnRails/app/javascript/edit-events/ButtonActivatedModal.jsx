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
        <KeydownDismissModal show={this.state.showModal} onHide={this.close}>
          <form className={this.props.formClass}
                onSubmit={e => { e.preventDefault(); this.props.onOk(); }}
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
        </KeydownDismissModal>
      </button>
    );
  }
}

// More or less copied from https://github.com/react-bootstrap/react-overlays/pull/195
// This can go away once a new version of react-overlays is released and react-bootstrap
// is updated to depend on it.
class KeydownDismissModal extends React.Component {
  static defaultProps = Modal.defaultProps;

  handleDocumentKeyDown = (e) => {
    if (this.props.keyboard && e.key === 'Escape' && this._modal._modal.isTopModal()) {
      if (this.props.onEscapeKeyDown) {
        this.props.onEscapeKeyDown(e);
      }

      this.props.onHide();
    }
  }

  onShow = () => {
    let doc = ownerDocument(this);
    this._onDocumentKeydownListener =
      addEventListener(doc, 'keydown', this.handleDocumentKeyDown);
  }

  onHide = () => {
    this._onDocumentKeydownListener.remove();
  }

  render() {
    let subprops = {
      ...this.props,
      keyboard: false,
      onShow: this.onShow,
    };
    return <Modal {...subprops} ref={m => this._modal = m} />;
  }
}
