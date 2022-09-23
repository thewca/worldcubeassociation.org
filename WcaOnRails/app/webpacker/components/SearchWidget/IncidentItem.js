import React from 'react';
import I18n from '../../lib/i18n';

function IncidentItem({
  item,
}) {
  return (
    <div className="omnisearch-item-incident">
      {I18n.t('incidents_log.incident')}
      {' '}
      {item.title}
    </div>
  );
}

export default IncidentItem;
