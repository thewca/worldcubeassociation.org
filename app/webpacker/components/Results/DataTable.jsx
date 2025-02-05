import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Table } from 'semantic-ui-react';
import React from 'react';

export default function DataTable({ rows, config }) {
  const table = useReactTable({
    data: rows || [],
    columns: config,
    getCoreRowModel: getCoreRowModel(),
  });

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
                cell.column.columnDef.isMultiAttemptsHack
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
