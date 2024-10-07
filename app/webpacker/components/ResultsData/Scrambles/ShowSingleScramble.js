import React from 'react';
import SingleEntryTable from '../Panel/SingleEntryTable';
import ScrambleRow from './ScrambleRow';
import ScrambleRowHeader from './ScrambleRowHeader';

function SingleScrambleRow({
  dataItem,
  dataItems,
}) {
  return (
    <ScrambleRow scramble={dataItem} scrambles={dataItems} adminMode={false} />
  );
}

function ShowSingleScramble({ dataItem }) {
  return (
    <SingleEntryTable
      dataItem={dataItem}
      HeaderComponent={ScrambleRowHeader}
      RowComponent={SingleScrambleRow}
      moreClassNames="event-scrambles"
    />
  );
}

export default ShowSingleScramble;
