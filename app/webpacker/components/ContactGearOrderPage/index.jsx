import React from 'react';
import { Container, Header } from 'semantic-ui-react';
import GearOrderForm from './GearOrderForm';
import i18n from '../../lib/i18n';

export default function ContactGearOrder() {
  const equipments = [
    {
      name: 'Tournament Display',
      description: 'Includes Display Stand, Data Cord, & AC Adapter',
      price_in_usd: 90,
      brand: 'Speedstacks',
      in_stock: true,
    },
    {
      name: 'G5 Cubing Pack',
      description: 'G5 Timer, Cubing Mat and Gear Bag',
      price_in_usd: 24.5,
      brand: 'Speedstacks',
      in_stock: true,
    },
    {
      name: 'G5 Timer Only',
      description: '',
      price_in_usd: 18,
      brand: 'Speedstacks',
      in_stock: true,
    },
    {
      name: 'G5 Mat Only',
      description: '',
      price_in_usd: 8.8,
      brand: 'Speedstacks',
      in_stock: true,
    },
    {
      name: 'Extra Data Cord',
      description: '',
      price_in_usd: 3,
      brand: 'Speedstacks',
      in_stock: true,
    },
    {
      name: 'Extra AC Adapter',
      description: '',
      price_in_usd: 3,
      brand: 'Speedstacks',
      in_stock: true,
    },
  ];
  return (
    <Container text>
      <Header as="h2">{i18n.t('page.contact_gear_order.title')}</Header>
      <GearOrderForm equipments={equipments} />
    </Container>
  );
}
