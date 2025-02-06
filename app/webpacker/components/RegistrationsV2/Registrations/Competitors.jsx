import { useQuery } from '@tanstack/react-query';
import React from 'react';
import {
  Flag, Segment, Table,
} from 'semantic-ui-react';
import _ from 'lodash';
import {
  flexRender, getCoreRowModel, getSortedRowModel, useReactTable
} from '@tanstack/react-table';
import {
  getConfirmedRegistrations,
} from '../api/registration/get/get_registrations';
import EventIcon from '../../wca/EventIcon';
import { personUrl } from '../../../lib/requests/routes.js.erb';
import I18n from '../../../lib/i18n';
import { countries } from '../../../lib/wca-data.js.erb';
import { expandSortTerm, getPeopleCounts, getTotals, getUserPositionInfo } from './utils';
import PreTableInfo from './PreTableInfo';
import Errored from '../../Requests/Errored';
import Loading from '../../Requests/Loading';

const getColumns = (eventIds) => [
  {
    accessorKey: 'user.name',
    header: I18n.t('activerecord.attributes.registration.name'),
    cell: (info) => info.getValue() ? (
      <a href={personUrl(info.row.original.user.wca_id)}>
        {info.getValue()}
      </a>
    ) : (
      info.getValue()
    ),
    footer: (info) => {
      const registrationCount = info.table.getCoreRowModel().rows.length;
      return (
        `${
          registrationCount
        } ${
          I18n.t(
            'registrations.registration_info_people.person',
            { count: info.table.getCoreRowModel().rows.length },
          )
        }`
      )
    },
  },
  {
    id: 'country',
    header: I18n.t('activerecord.attributes.user.country_iso2'),
    accessorFn: (row) => countries.byIso2[row.user.country.iso2].name,
    cell: (info) => (
      <>
        <Flag
          className={info.row.original.user.country.iso2.toLowerCase()}
        />
        {info.getValue()}
      </>
    ),
    footer: (info) => {
      const { countryCount } = getTotals(
        info.table.getCoreRowModel().rows.map((row) => row.original),
        eventIds,
      );
      return `${I18n.t('registrations.list.country_plural', { count: countryCount })}`
    }
  },
  ...eventIds.map((id) => ({
    id,
    header: <EventIcon id={id} size="1em" className="selected" />,
    enableSorting: false,
    accessorFn: (row) => row.competing.event_ids.includes(id),
    cell: (info) => (
      info.getValue() && <EventIcon id={id} size="1em" hoverable={false} />
    ),
    footer: (info) => (
      info.table.getCoreRowModel().rows.filter((row) => row.getValue(id)).length
    ),
    meta: { style: { textAlign: 'center' } },
  })),
  {
    id: 'event-count',
    header: I18n.t('registrations.list.total'),
    accessorFn: (row) => row.competing.event_ids.length,
    footer: (info) => (
      info.table.getCoreRowModel().rows.reduce(
        (acc, row) => acc + row.getValue('event-count'),
        0,
      )
    ),
    meta: { style: { textAlign: 'center' } },
  },
];

export default function Competitors({
  competitionInfo,
  eventIds,
  onEventClick,
  userId,
  userRowRef,
  onScrollToMeClick,
}) {
  const { isLoading, data, isError } = useQuery({
    queryKey: ['registrations', competitionInfo.id],
    queryFn: () => getConfirmedRegistrations(competitionInfo),
    retry: false,
    // react table sorting is stable, and we want the default tie-breaker
    //  to be name (not registration id, which the backend sorts by)
    select: (queryData) => queryData.toSorted((a, b) => a.user.name.localeCompare(b.user.name))
  });

  const table = useReactTable({
    data: data || [],
    columns: getColumns(eventIds),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSortingRemoval: false,
    initialState: {
      sorting: [{ id: 'user_name', desc: false }],
    },
  });

  if (isError) {
    return (
      <Errored componentName="Competitors" />
    );
  }

  if (isLoading) {
    return (
      <Segment>
        <Loading />
      </Segment>
    );
  }

  const { userIsInTable } = getUserPositionInfo(data, userId);

  const {
    registrationCount, newcomerCount, returnerCount
  } = getPeopleCounts(data);

  return (
    <>
      <PreTableInfo
        scrollToMeIsShown={userIsInTable}
        userRankIsShown={false}
        registrationCount={registrationCount}
        newcomerCount={newcomerCount}
        returnerCount={returnerCount}
        onScrollToMeClick={onScrollToMeClick}
      />
      <Table striped sortable unstackable compact singleLine textAlign="left">
        <Table.Header>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Row key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Table.HeaderCell
                  key={header.id}
                  sorted={expandSortTerm(header.column.getIsSorted())}
                  onClick={
                    header.column.getCanSort()
                      ? header.column.getToggleSortingHandler()
                      : () => onEventClick(header.column.id)
                  }
                  textAlign={header.column.columnDef.meta?.style?.textAlign}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </Table.HeaderCell>
              ))}
            </Table.Row>
          ))}
        </Table.Header>
        <Table.Body>
          {table.getSortedRowModel().rows.length > 0 ? (
            table.getSortedRowModel().rows.map((row) => {
              const isUser = row.original.user_id === userId; 
              return (
                <Table.Row active={isUser}>
                  {row.getVisibleCells().map((cell, index) => (
                    <Table.Cell
                      key={cell.id}
                      textAlign={cell.column.columnDef.meta?.style?.textAlign}
                    >
                      <div ref={(isUser && (index === 0)) ? userRowRef : undefined}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    </Table.Cell>
                  ))}
                </Table.Row>
              );
            })
          ) : (
            <Table.Row>
              <Table.Cell colSpan={table.getAllColumns().length} textAlign='center'>
                {I18n.t('competitions.registration_v2.list.empty')}
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
        <Table.Footer>
          {table.getFooterGroups().map(footerGroup => (
            <Table.Row key={footerGroup.id}>
              {footerGroup.headers.map(header => (
                <Table.HeaderCell
                  key={header.id}
                  textAlign={header.column.columnDef.meta?.style?.textAlign}
                >
                  {flexRender(header.column.columnDef.footer, header.getContext())}
                </Table.HeaderCell>
              ))}
            </Table.Row>
          ))}
        </Table.Footer>
      </Table>
    </>
  );
}
