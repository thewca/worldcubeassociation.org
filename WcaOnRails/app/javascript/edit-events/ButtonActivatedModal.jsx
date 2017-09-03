import React from 'react'
import cn from 'classnames'
import Modal from 'react-bootstrap/lib/Modal'
import Button from 'react-bootstrap/lib/Button'

export default class extends React.Component {
  constructor() {
    super();
    this.state = { showModal: false };
  }

  open = () => {
    this.setState({ showModal: true });
  }

  close = () => {
    this.props.reset();
    this.setState({ showModal: false });
  }

  render() {
    return (
      <button type="button" name={this.props.name} className={cn("btn", this.props.buttonClass)} onClick={this.open}>
        {this.props.buttonValue}
        <Modal show={this.state.showModal} onHide={this.close} backdrop="static">
          <form className={this.props.formClass} onSubmit={e => { e.preventDefault(); this.props.onSave(); }}>
            {this.props.children}
            <Modal.Footer>
              <Button onClick={this.close} className="pull-left">Close</Button>
              <Button onClick={this.props.reset} bsStyle="danger" className="pull-left">Reset</Button>
              <Button type="submit" bsStyle="primary">Save</Button>
            </Modal.Footer>
          </form>
        </Modal>
      </button>
    );
  }
}
