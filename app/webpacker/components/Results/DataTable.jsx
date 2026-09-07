import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Segment, Table } from 'semantic-ui-react';
import React from 'react';
import I18n from '../../lib/i18n';

export default function DataTable({ rows, config }) {
  const tableData = rows || [];

  const table = useReactTable({
    data: tableData,
    columns: config,
    getCoreRowModel: getCoreRowModel(),
  });

  if (tableData.length === 0) {
    return (
      <Segment>{I18n.t('search_results.index.not_found.generic')}</Segment>
    );
  }

  return (
    <div style={{ overflowX: 'scroll' }}>
      <Table basic="very" compact="very" striped unstackable singleLine>
        <Table.Header>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Row key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Table.HeaderCell key={header.id} colSpan={header.column.columnDef.colSpan}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </Table.HeaderCell>
              ))}
            </Table.Row>
          ))}
        </Table.Header>
        <Table.Body>
          {table.getRowModel().rows.map((row) => (
            <Table.Row key={row.id}>
              {row.getVisibleCells().map((cell) => (
                cell.column.columnDef.rendersOwnCells
                  ? (
                    <React.Fragment key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </React.Fragment>
                  )
                  : (
                    <Table.Cell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </Table.Cell>
                  )
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
}
