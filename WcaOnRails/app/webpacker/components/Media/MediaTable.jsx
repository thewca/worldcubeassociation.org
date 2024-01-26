import React, { useEffect, useState } from 'react';

import _ from 'lodash';
import { Table, Confirm, Modal, Button, GridRow } from 'semantic-ui-react';

import { competitionUrl } from '../../lib/requests/routes.js.erb';
import { countries, continents, years } from '../../lib/wca-data.js.erb';
import { dateRangeBetween } from '../../lib/helpers/media-table';
import useLoadedData from '../../lib/hooks/useLoadedData';
import useSaveAction from '../../lib/hooks/useSaveAction';
import {
  DropdownMenu,
  DropdownItem,
  DropdownHeader,
  DropdownDivider,
  Dropdown,
} from 'semantic-ui-react'
export default function MediaTable({ isValidate }) {
  const countryOptions = _.map(countries.byIso2, (country) => ({
    key: country.iso2,
    text: country.name,
    value: country.iso2,
  }));
  const continentOptions = continents.map((continent) => ({
    key: continent.id,
    text: continent.name,
    value: continent.name,
  }));
  const yearOptions = [
    {
      key: 'all',
      text: 'All Years',
      value: 'All Years',
    },
    ...years.map((year) => ({
      key: year,
      text: year,
      value: year,
    })),
  ];


  const handleUpdateSuccess = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };
  const [selectedYear, setSelectedYear] = useState(yearOptions[1].value);
  const [selectedRegion, setSelectedRegion] = useState("All Regions");
  const { save, saving } = useSaveAction();
  const [mediaCombined, setMediaCombined] = useState([])
  const type = isValidate ? 'pending' : 'accepted'
  const { loading, error, data, sync } = useLoadedData(
    `/api/v0/media?status=${type}&year=${selectedYear}&region=${selectedRegion}`,
  );
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (data) {
      setMediaCombined(data?.map((medium, idx) => {
        const iso2 = medium.competition.country_iso2;
        const country = countries.byIso2[iso2];
        return {
          timestampSubmitted: new Date(medium.timestampSubmitted).toString(),
          timestampDecided: medium.timestampDecided,
          id: medium.competition.id,
          name: medium.competition.name,
          type: medium.type,
          text: medium.text,
          uri: medium.uri,
          country_iso2: iso2,
          country_name: country ? country.name : '',
          city: medium.competition.city,
          startDate: medium.competition.start_date,
          endDate: medium.competition.end_date,
          mediaId: medium.id,
          competetionDate: dateRangeBetween(medium.competition.start_date, medium.competition.end_date),
          competetionUrl: competitionUrl(medium.competition.id)
        };
      }))
    }
  }, [data]);
  const [modalParams, setModalParams] = React.useState({
    open: false,
    mediaId: null,
    status: null,
  });
  const confimMedia = () => {
        const url = "/api/v0/media/" + modalParams.mediaId
    save(url, { status: modalParams.status }, () => {
      sync(); handleUpdateSuccess(); setModalParams({ ...modalParams, open: false })
    }, { method: 'PATCH' });
  };
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);
  const handleSort = (clickedColumn) => () => {
    if (sortColumn !== clickedColumn) {
      setSortColumn(clickedColumn);
      setSortDirection('ascending');
      setMediaCombined([...mediaCombined].sort((a, b) => a[clickedColumn] - b[clickedColumn]));
    } else {
      setMediaCombined([...mediaCombined].reverse());
      setSortDirection(sortDirection === 'ascending' ? 'descending' : 'ascending');
    }
  };
  const handleSelectYear = (event, data) => {
    setSelectedYear(data.value);
  };
  const handleSelectRegion = (event, data) => {
    console.log(data)
    setSelectedRegion(data.value);
  };
  return (
    <div>
      <Dropdown
        placeholder='Select Year'
        search
        selection
        options={yearOptions}
        onChange={handleSelectYear}
        value={selectedYear}
        text={selectedYear}
      />
      <Dropdown
        placeholder='Select Region'
        search
        selection
        value={selectedRegion}
        text={selectedRegion}
        onChange={handleSelectRegion}
      >
        <DropdownMenu>
          <DropdownItem
            key={"all"}
            onClick={handleSelectRegion}
            value={"All Regions"}
          >
            {"All Regions"}
          </DropdownItem>
          <DropdownHeader>Continent</DropdownHeader>
          {continentOptions.map((continent) => (
            <DropdownItem
              key={continent.id}
              onClick={handleSelectRegion}
              value={continent.text}
            >
              {continent.text}
            </DropdownItem>
          ))}
          <DropdownDivider />
          <DropdownHeader>Region</DropdownHeader>
          {countryOptions.map((country) => (
            <DropdownItem
              key={country.key}
              onClick={handleSelectRegion}
              value={country.text}
            >
              {country.text}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>

      <Table sortable celled fixed>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell
              sorted={sortColumn === 'timestampSubmitted' ? sortDirection : null}
              onClick={handleSort('timestampSubmitted')}
            >
              Submission Date
            </Table.HeaderCell>
            <Table.HeaderCell
              sorted={sortColumn === 'timestampDecided' ? sortDirection : null}
              onClick={handleSort('timestampDecided')}
            >
              Competition Date
            </Table.HeaderCell>
            <Table.HeaderCell
              sorted={sortColumn === 'competetion' ? sortDirection : null}
              onClick={handleSort('competetion')}
            >{I18n.t('activerecord.attributes.competition_medium.competitionId')}</Table.HeaderCell>
            <Table.HeaderCell
              sorted={sortColumn === 'location' ? sortDirection : null}
              onClick={handleSort('location')}
            >{I18n.t('media.media_table.location')}</Table.HeaderCell>
            <Table.HeaderCell
              sorted={sortColumn === 'type' ? sortDirection : null}
              onClick={handleSort('type')}
            >{I18n.t('activerecord.attributes.competition_medium.type')}</Table.HeaderCell>
            <Table.HeaderCell
              sorted={sortColumn === 'link' ? sortDirection : null}
              onClick={handleSort('link')}>{I18n.t('activerecord.attributes.competition_medium.uri')}</Table.HeaderCell>
            {isValidate && <Table.HeaderCell></Table.HeaderCell>}
          </Table.Row>
        </Table.Header>
        <Table.Body>

          {mediaCombined?.map((media_row) => (
            <Table.Row>
              <Table.Cell>
                {moment.utc(media_row.timestampSubmitted).format('MMMM DD, YYYY HH:mm UTC')}
              </Table.Cell>
              <Table.Cell>
                {media_row.competetionDate}
              </Table.Cell>
              <Table.Cell>
                <a href={media_row.competetionUrl}>{media_row.name}</a>
              </Table.Cell>
              <Table.Cell>
                {media_row.country_name}
                ,
                {media_row.city}
              </Table.Cell>
              <Table.Cell>
                {media_row.type}
              </Table.Cell>
              <Table.Cell>
                <a href={media_row.uri}>{media_row.text}</a>
              </Table.Cell>
              {isValidate &&
                <Table.Cell>
                  <a href="#" onClick={() => setModalParams({ open: true, mediaId: media_row.mediaId, status: "accepted" })}>
                    <i className="check icon"></i>
                  </a>
                  <a href={`/media/${media_row.mediaId}/edit`}>
                    <i class="edit icon"></i>
                  </a>
                  <a href="#" onClick={() => setModalParams({ open: true, mediaId: media_row.mediaId, status: "rejected" })}>
                    <i className="trash icon"></i>
                  </a>
                </Table.Cell>
              }
            </Table.Row>
          ))}
          <Confirm
            open={modalParams.open}
            onCancel={() => setConfirmOpen(false)}
            onConfirm={() => confimMedia()}
            content={`Are you sure you want to ${modalParams.status === 'accepted' ? 'approve' : 'reject'} this media?`}
          />
          <Modal open={modalOpen} onClose={handleCloseModal}>
            <Modal.Header>Update Successful</Modal.Header>
            <Modal.Content>
              <p>Media {modalParams.status} successfully!</p>
            </Modal.Content>
            <Modal.Actions>
              <Button positive onClick={handleCloseModal}>
                OK
              </Button>
            </Modal.Actions>
          </Modal>
        </Table.Body>
      </Table>
    </div>
  );
}
