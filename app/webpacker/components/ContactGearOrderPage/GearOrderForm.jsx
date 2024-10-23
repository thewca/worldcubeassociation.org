/* eslint-disable max-len */
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import {
  Form, Header, HeaderSubheader, Input, Message, Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'semantic-ui-react';
import useSaveAction from '../../lib/hooks/useSaveAction';
import Loading from '../Requests/Loading';
import Errored from '../Requests/Errored';
import { contactGearOrderUrl } from '../../lib/requests/routes.js.erb';
import i18n from '../../lib/i18n';

export default function GearOrderForm({ equipments }) {
  const [orderDetails, setOrderDetails] = useState(equipments.map(() => ({
    quantity: 0,
    price: 0,
  })));
  const [totalPrice, setTotalPrice] = useState(0);
  const [formValues, setFormValues] = useState({});
  const { save, saving } = useSaveAction();
  const [saveError, setSaveError] = useState();
  const [contactSuccess, setContactSuccess] = useState(false);

  useEffect(() => {
    setTotalPrice(_.sumBy(orderDetails, 'price'));
  }, [orderDetails]);

  const setQuantity = (quantity, index) => {
    setOrderDetails(orderDetails.map((orderDetail, orderDetailIndex) => {
      if (index === orderDetailIndex) {
        return {
          quantity,
          price: quantity * equipments[index].price_in_usd,
        };
      }
      return orderDetail;
    }));
  };

  const handleFormChange = (__, { name, value }) => setFormValues({ ...formValues, [name]: value });

  const contactSuccessHandler = () => {
    setFormValues({});
    setContactSuccess(true);
  };

  if (saving) return <Loading />;
  if (saveError) return <Errored error={saveError} />;

  return (
    <>
      {contactSuccess && (
      <Message
        success
        content={i18n.t('page.contacts.success_message')}
      />
      )}
      <Form onSubmit={() => save(
        contactGearOrderUrl,
        { formValues, orderDetails },
        contactSuccessHandler,
        { method: 'POST' },
        setSaveError,
      )}
      >
        <Header as="h3">Order Details</Header>
        <Table celled structured>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Equipment</TableHeaderCell>
              <TableHeaderCell>Quantity</TableHeaderCell>
              <TableHeaderCell>Price</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <Table.Body>
            {equipments.map((equipment, index) => (
              <Table.Row>
                <Table.Cell>
                  <Header as="h4">{equipment.name}</Header>
                  <HeaderSubheader>{equipment.description}</HeaderSubheader>
                  <HeaderSubheader>
                    Brand:
                    {equipment.brand}
                  </HeaderSubheader>
                  <HeaderSubheader>
                    Price per unit:
                    {' '}
                    {equipment.price_in_usd}
                    {' '}
                    USD
                  </HeaderSubheader>
                </Table.Cell>
                <Table.Cell>
                  <Input
                    type="number"
                    value={orderDetails[index].quantity}
                    onChange={(e, { value }) => setQuantity(value, index)}
                  />
                </Table.Cell>
                <Table.Cell>
                  {orderDetails[index].price}
                  {' '}
                  USD
                </Table.Cell>
              </Table.Row>
            ))}
            <Table.Row>
              <Table.Cell><b>Total</b></Table.Cell>
              <Table.Cell />
              <Table.Cell>
                {totalPrice}
                {' '}
                USD
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
        <Header as="h3">Shipping Details</Header>
        <Form.Input
          label={(
            <>
              <Header as="h4">Name</Header>
              <div>Name of the individual receiving the shipment</div>
            </>
        )}
          name="shippingName"
          value={formValues.shippingName}
          onChange={handleFormChange}
        />
        <Form.TextArea
          label={(
            <>
              <Header as="h4">Address</Header>
              <div>
                Address of the individual receiving the shipment, including the country. Format the address using the international address standard for your country.

                Shipping costs outside the US and Canada can vary from country to country and be expensive. Usually this is 25-50% of the equipment cost. This does not include local customs costs or taxes like VAT. Prior to shipping, we will verify the final invoice with you.

                You may use a third-party mail forwarding service if preferred.
              </div>
            </>
        )}
          name="shippingAddress"
          value={formValues.shippingAddress}
          onChange={handleFormChange}
        />
        <Form.Input
          label={(
            <>
              <Header as="h4">Phone Number</Header>
              <div>
                Full phone number of the recipient, including the country code. This will be sent to UPS and used in case there are issues with shipping or delivery.
              </div>
            </>
        )}
          name="shippingPhoneNumber"
          value={formValues.shippingPhoneNumber}
          onChange={handleFormChange}
        />
        <Form.Input
          label={(
            <>
              <Header as="h4">Email</Header>
              <div>
                Email address of the recipient. This will be sent to UPS for shipping updates and used as a backup contact method if necessary.
              </div>
            </>
        )}
          name="shippingEmail"
          value={formValues.shippingEmail}
          onChange={handleFormChange}
        />
        <Header as="h3">
          Invoice Details (Delegate or regional organization to send the invoice to)
        </Header>
        <Form.Input
          label="Name"
          name="invoiceName"
          value={formValues.invoiceName}
          onChange={handleFormChange}
        />
        <Form.Input
          label="Email"
          name="invoiceEmail"
          value={formValues.invoiceEmail}
          onChange={handleFormChange}
        />
        <Form.Checkbox
          label="By submitting this application, you agree to use this equipment only for WCA Competitions and Activities and that you will not sell or distribute this equipment to anyone else without the express written permission from the WCA Marketing Team (WMT)."
        />
        <Form.Checkbox
          label="I confirm that all the order details and shipping details are correct and this order is ready to be submitted."
        />
        <Form.Button type="submit">Submit Form</Form.Button>
      </Form>
    </>
  );
}
