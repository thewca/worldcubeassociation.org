import React, { useState } from 'react';
import { Form } from 'semantic-ui-react';
import useSaveAction from '../../../../lib/hooks/useSaveAction';
import Loading from '../../../Requests/Loading';
import { panelWfcEquipmentsUrl } from '../../../../lib/requests/routes.js.erb';
import Errored from '../../../Requests/Errored';

export default function EquipmentForm({ equipmentDetails = {}, closeForm, sync }) {
  const { save, saving } = useSaveAction();
  const [formError, setFormError] = useState();

  if (saving) return <Loading />;
  if (formError) return <Errored />;

  return (
    <Form onSubmit={(event) => {
      const formData = Object.fromEntries(new FormData(event.target));
      if (Object.hasOwnProperty.call(formData, 'in_stock_for_purchase')) {
        formData.in_stock_for_purchase = true;
      } else {
        formData.in_stock_for_purchase = false;
      }
      save(panelWfcEquipmentsUrl, formData, () => {
        sync();
      }, {
        method: 'POST', // do patch if edit
        setFormError,
      });
    }}
    >
      <Form.Input
        label="Name"
        name="name"
        defaultValue={equipmentDetails?.name}
      />
      <Form.Input
        label="Description"
        name="description"
        defaultValue={equipmentDetails?.description}
      />
      <Form.Input
        label="Price in USD"
        name="price_in_usd"
        defaultValue={equipmentDetails?.price_in_usd}
      />
      <Form.Input
        label="Brand"
        name="brand"
        defaultValue={equipmentDetails?.brand}
      />
      <Form.Checkbox
        label="In-stock for purchase"
        name="in_stock_for_purchase"
        defaultValue={equipmentDetails?.in_stock_for_purchase}
      />
      <Form.Button onClick={closeForm}>Cancel</Form.Button>
      <Form.Button type="submit">Save</Form.Button>
    </Form>
  );
}
