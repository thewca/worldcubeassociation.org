import React from 'react';
import {
  Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow,
} from 'semantic-ui-react';
import I18nHTMLTranslate from '../I18nHTMLTranslate';

export default function RecordCollection({
  wr, cr, nr,
}) {
  return (
    <div className="col-md-6">
      <h3 className="text-center">
        <I18nHTMLTranslate i18nKey="persons.show.record_collection" />
      </h3>
      <Table striped basic="very" textAlign="center" structured>
        <TableHeader fullWidth>
          <TableRow textAlign="center">
            <TableHeaderCell width={3}>WR</TableHeaderCell>
            <TableHeaderCell width={3}>CR</TableHeaderCell>
            <TableHeaderCell width={3}>NR</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* trick to have first row striped */}
          <TableRow style={{ display: 'none' }} />
          <TableRow>
            <TableCell>{wr}</TableCell>
            <TableCell>{cr}</TableCell>
            <TableCell>{nr}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
