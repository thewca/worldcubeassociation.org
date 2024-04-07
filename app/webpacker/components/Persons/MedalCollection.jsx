/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import {
  Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow,
} from 'semantic-ui-react';
import I18nHTMLTranslate from '../I18nHTMLTranslate';

// TODO: Make table highlight rows when user clicks on medal count. like old one
export default function MedalCollection({
  gold, silver, bronze,
}) {
  return (
    <div className="col-md-6">
      <h3 className="text-center">
        <I18nHTMLTranslate i18nKey="persons.show.medal_collection" />
      </h3>
      <Table striped basic="very" textAlign="center" structured>
        <TableHeader fullWidth>
          <TableRow textAlign="center">
            <TableHeaderCell width={3}>
              <I18nHTMLTranslate i18nKey="persons.show.medals.gold" />
            </TableHeaderCell>
            <TableHeaderCell width={3}>
              <I18nHTMLTranslate i18nKey="persons.show.medals.silver" />
            </TableHeaderCell>
            <TableHeaderCell width={3}>
              <I18nHTMLTranslate i18nKey="persons.show.medals.bronze" />
            </TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* trick to have first row striped */}
          <TableRow style={{ display: 'none' }} />
          <TableRow>
            <TableCell>
              <a href="#" onClick={null}>{gold}</a>
            </TableCell>
            <TableCell>
              <a href="#" onClick={null}>{silver}</a>
            </TableCell>
            <TableCell>
              <a href="#" onClick={null}>{bronze}</a>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
