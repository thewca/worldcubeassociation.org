import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import _ from 'lodash';

import rootRender from '../../../lib/edit-events';

import ButtonActivatedModal from '../ButtonActivatedModal';
import QualificationComponents from '../Qualification';

const EventAttributeComponents = {
  qualification: QualificationComponents,
};

class EditEventAttribute extends React.Component {
  UNSAFE_componentWillMount() {
    this.reset();
  }

  UNSAFE_componentWillReceiveProps() {
    this.reset();
  }

  getSavedValue() {
    const { wcifEvent, attribute } = this.props;
    return wcifEvent[attribute];
  }

  hasUnsavedChanges = () => !_.isEqual(this.getSavedValue(), this.state.value);

  onChange = (value) => {
    this.setState({ value });
  };

  onOk = () => {
    const { wcifEvent, attribute } = this.props;
    wcifEvent[attribute] = this.state.value;

    this._modal.close({ skipUnsavedChangesCheck: true });
    rootRender();
  };

  reset = () => {
    this.setState({ value: this.getSavedValue() });
  };

  render() {
    const { wcifEvent, attribute, disabled } = this.props;
    const { Show } = EventAttributeComponents[attribute];
    const { Input } = EventAttributeComponents[attribute];
    const { Title } = EventAttributeComponents[attribute];

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
}

export function EditQualificationButton(props) {
  return <EditEventAttribute {...props} attribute="qualification" />;
}
