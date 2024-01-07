import React from 'react';
import PanelTemplate from '../PanelTemplate';
import PANEL_LIST from '../PanelList';
import Translators from './Translators';

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
