import React from 'react';

import RegionFlag from '../wca/RegionFlag';
import '../../stylesheets/search_widget/CompetitionItem.scss';

function CompetitionItem({
  item,
}) {
  return (
    <div className="multisearch-item-competition">
      <div>{item.name}</div>
      <div className="extra-details">
        <RegionFlag iso2={item.country_iso2} />
        {`${item.city} (${item.id})`}
      </div>
    </div>
  );
}

export default CompetitionItem;
