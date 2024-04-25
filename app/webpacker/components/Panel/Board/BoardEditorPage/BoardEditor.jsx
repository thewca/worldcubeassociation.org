import React, { useState } from 'react';
import {
  Button, Form, Header, Modal, Table,
} from 'semantic-ui-react';
import { useConfirm } from '../../../../lib/providers/ConfirmProvider';
import useSaveAction from '../../../../lib/hooks/useSaveAction';
import { apiV0Urls } from '../../../../lib/requests/routes.js.erb';
import { groupTypes } from '../../../../lib/wca-data.js.erb';
import Loading from '../../../Requests/Loading';
import SEARCH_MODELS from '../../../SearchWidget/SearchModel';
import WcaSearch from '../../../SearchWidget/WcaSearch';
import useInputState from '../../../../lib/hooks/useInputState';

export default function BoardEditor({ boardRoles, sync }) {
  const [openModal, setOpenModal] = useState(false);
  const [newBoardRole, setNewBoardRole] = useInputState(null);
  const { save, saving } = useSaveAction();
  const confirm = useConfirm();

  const endRole = (boardRole) => {
    confirm().then(() => {
      save(apiV0Urls.userRoles.delete(boardRole.id), {}, sync, { method: 'DELETE' });
    });
  };

  const closeModal = () => {
    setNewBoardRole(null);
    setOpenModal(false);
  };

  if (saving) return <Loading />;

  return (
    <>
      <Header>Board Editor</Header>
      <Button onClick={() => setOpenModal(true)}>Add Role</Button>
      <Table celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {boardRoles.map((boardRole) => (
            <Table.Row key={boardRole.id}>
              <Table.Cell>{boardRole.user.name}</Table.Cell>
              <Table.Cell>
                <Button onClick={() => endRole(boardRole)}>End Role</Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      {openModal && (
      <Modal
        size="fullscreen"
        open={openModal}
        onClose={closeModal}
      >
        <Modal.Content>
          <Header>Add Board Role</Header>
          <Form onSubmit={() => {
            save(apiV0Urls.userRoles.create(), {
              groupType: groupTypes.board,
              userId: newBoardRole.id,
            }, () => {
              sync();
              closeModal();
            }, { method: 'POST' });
          }}
          >
            <Form.Field
              label="New Board member"
              control={WcaSearch}
              name="user"
              value={newBoardRole}
              onChange={setNewBoardRole}
              model={SEARCH_MODELS.user}
              multiple={false}
            />
            <Button type="submit">Submit</Button>
          </Form>
        </Modal.Content>
      </Modal>
      )}
    </>
  );
}
