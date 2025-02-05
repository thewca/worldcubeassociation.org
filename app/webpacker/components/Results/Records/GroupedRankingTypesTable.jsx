import React from 'react';
import {Header} from 'semantic-ui-react';
import I18n from '../../../lib/i18n';

export default function GroupedRankingTypesTable({ results, children }) {
  const [, singleRecords, averageRecords] = results;

  return (
    <>
      <Header>{I18n.t('results.selector_elements.type_selector.single')}</Header>
      {children(singleRecords, 'single')}
      <Header>{I18n.t('results.selector_elements.type_selector.average')}</Header>
      {children(averageRecords, 'average')}
    </>
  );
}
