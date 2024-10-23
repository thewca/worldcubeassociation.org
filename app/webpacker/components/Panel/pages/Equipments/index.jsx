import React, { useState } from 'react';
import {
  Button, Loader, Modal, Table,
} from 'semantic-ui-react';
import EquipmentForm from './EquipmentForm';
import useLoadedData from '../../../../lib/hooks/useLoadedData';
import { panelWfcEquipmentsUrl } from '../../../../lib/requests/routes.js.erb';
import Errored from '../../../Requests/Errored';

export default function Equipments() {
  const [equipmentParams, setEquipmentParams] = useState(null);
  const {
    data, loading, error, sync,
  } = useLoadedData(panelWfcEquipmentsUrl);

  if (loading) return <Loader />;
  if (error) return <Errored />;

  return (
    <>
      <Button onClick={() => setEquipmentParams({ action: 'Create' })}>Create Equipment Entry</Button>
      <Table celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Description</Table.HeaderCell>
            <Table.HeaderCell>Price in USD</Table.HeaderCell>
            <Table.HeaderCell>Brand</Table.HeaderCell>
            <Table.HeaderCell>In-stock for purchase</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data?.map((equipment) => (
            <Table.Row key={equipment.id}>
              <Table.Cell>{equipment.name}</Table.Cell>
              <Table.Cell>{equipment.description}</Table.Cell>
              <Table.Cell>{equipment.price_in_usd}</Table.Cell>
              <Table.Cell>{equipment.brand}</Table.Cell>
              <Table.Cell>{equipment.in_stock_for_purchase ? 'Yes' : 'No'}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <Modal
        open={!!equipmentParams}
        onClose={() => setEquipmentParams(null)}
      >
        <Modal.Header>Add/Edit Equipment</Modal.Header>
        <Modal.Content>
          <EquipmentForm
            equipmentDetails={equipmentParams?.equipmentDetails}
            closeForm={() => setEquipmentParams(null)}
            sync={sync}
          />
        </Modal.Content>
      </Modal>
    </>
  );
}
