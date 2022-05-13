import React from 'react';

import CountryFlag from '../wca/CountryFlag';
import '../../stylesheets/search_widget/CompetitionItem.scss';

const CompetitionItem = ({
  item,
}) => (
  <div className="omnisearch-item-competition">
    <div>{item.name}</div>
    <div className="extra-details">
      <CountryFlag iso2={item.country_iso2} />
      {`${item.city} (${item.id})`}
    </div>
  </div>
);

export default CompetitionItem;
