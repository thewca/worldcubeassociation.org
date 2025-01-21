import React from 'react';
import { Header, Table } from 'semantic-ui-react';
import I18n from '../../../lib/i18n';
import { SeparateHeader } from '../TableHeaders';
import { SeparateRecordsRow } from '../TableRows';
import RecordsTable from '../RecordsTable';

export default function SeparateRecordsTables({ rows, competitionsById }) {
  const [, singleRecords, averageRecords] = rows;

  return (
    <>
      <Header>{I18n.t('results.selector_elements.type_selector.single')}</Header>
      <RankingTypeTable records={singleRecords} competitionsById={competitionsById} rankingType="single" />
      <Header>{I18n.t('results.selector_elements.type_selector.average')}</Header>
      <RankingTypeTable records={averageRecords} competitionsById={competitionsById} rankingType="average" />
    </>
  );
}

function RankingTypeTable({ records, rankingType, competitionsById }) {
  return (
    <RecordsTable>
      <SeparateHeader isAverage={rankingType === 'average'} />
      <Table.Body>
        {records.map((row) => (
          <SeparateRecordsRow
            key={row.id}
            rankingType={rankingType}
            competition={competitionsById[row.competitionId]}
            result={row}
          />
        ))}
      </Table.Body>
    </RecordsTable>
  );
}
