import React from 'react';
import { Table } from 'semantic-ui-react';

function SingleEntryTable({
  dataItem,
  HeaderComponent,
  RowComponent,
  moreClassNames = null,
}) {
  return (
    <Table striped className={moreClassNames}>
      <Table.Header>
        <HeaderComponent />
      </Table.Header>
      <Table.Body>
        <RowComponent dataItem={dataItem} dataItems={[dataItem]} index={0} />
      </Table.Body>
    </Table>
  );
}

export default SingleEntryTable;
