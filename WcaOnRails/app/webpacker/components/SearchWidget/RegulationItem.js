import React from 'react';

import '../../stylesheets/search_widget/RegulationItem.scss';

function RegulationItem({
  item,
}) {
  return (
    <div className="multisearch-item-reg">
      <div className="reg-id">
        {item.id}
        :
      </div>
      {/* eslint-disable-next-line react/no-danger */}
      <div className="reg-text" dangerouslySetInnerHTML={{ __html: item.content_html }} />
    </div>
  );
}

export default RegulationItem;
