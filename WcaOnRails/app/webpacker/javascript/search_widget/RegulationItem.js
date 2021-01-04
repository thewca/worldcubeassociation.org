import React from 'react';

import './RegulationItem.scss';

const RegulationItem = ({
  item,
}) => (
  <div className="omnisearch-item-reg">
    <div className="reg-id">
      {item.id}
      :
    </div>
    {/* eslint-disable-next-line react/no-danger */}
    <div className="reg-text" dangerouslySetInnerHTML={{ __html: item.content_html }} />
  </div>
);

export default RegulationItem;
