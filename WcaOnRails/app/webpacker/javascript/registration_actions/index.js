import React, { useState } from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import {
  Icon,
} from 'semantic-ui-react';

import { registerComponent } from '../wca/react-utils';
import I18n from '../i18n';

function RegistrationActions() {
  const [show, setShow] = useState(false);
  const closeModal = () => setShow(false);
  const openModal = () => setShow(true);

  return (
    <div>
      <Modal
        centered="true"
        show={show}
        onHide={closeModal}
        id="delete-reasons-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title> Causes for Deleteion </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h1>Hello</h1>
        </Modal.Body>
        <Modal.Footer>
          <button type="submit" className="btn btn-warning" onClick={closeModal}>Close</button>
          <button type="submit" className="btn btn-danger" name="registrations_action" value="delete-selected">Delete</button>
        </Modal.Footer>
      </Modal>
      <div id="registrations-actions" className="btn-group" role="group">
        <button type="submit" className="btn btn-info selected-registrations-actions" name="registrations_action" value="export-selected">
          <Icon name="download" />
          {I18n.t('registrations.list.export_csv')}
        </button>
        <a href="#top" id="email-selected" target="_blank" className="btn btn-info selected-registrations-actions">
          <Icon name="envelope" />
          {I18n.t('registrations.list.email')}
        </a>
        <button type="submit" className="btn btn-success selected-pending-deleted-registrations-actions" name="registrations_action" value="accept-selected">
          <Icon name="check" />
          {I18n.t('registrations.list.approve')}
        </button>
        <button type="submit" className="btn btn-warning selected-approved-deleted-registrations-actions" name="registrations_action" value="reject-selected">
          <Icon name="times" />
          {I18n.t('registrations.list.reject')}
        </button>
        <button type="button" className="btn btn-danger selected-pending-approved-registrations-actions" onClick={openModal}>
          <Icon name="trash" />
          {I18n.t('registrations.list.delete')}
        </button>
      </div>
    </div>
  );
}

registerComponent(RegistrationActions, 'RegistrationActions');
