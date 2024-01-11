import React from 'react';
import PanelTemplate from '../PanelTemplate';
import Translators from './Translators';
import { PANEL_LIST } from '../../../lib/wca-data.js.erb';

const sections = [
  {
    id: PANEL_LIST.wst.translators,
    name: 'Translators',
    component: Translators,
  },
];

export default function Wst() {
  return (
    <PanelTemplate heading="WST Panel" sections={sections} />
  );
}
