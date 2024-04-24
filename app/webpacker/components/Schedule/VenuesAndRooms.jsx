import React from 'react';
import {
  Form, Grid, Menu, Message,
} from 'semantic-ui-react';
import { getTextColor } from '../../lib/utils/calendar';
import { toDegrees } from '../../lib/utils/edit-schedule';

export default function VenuesAndRooms({
  venues,
  activeVenueOrNull,
  activeVenueIndex,
  setActiveVenueIndex,
  timeZoneCount,
  rooms,
  activeRoomIds,
  dispatchRooms,
}) {
  const venueCount = venues.length;

  const setActiveVenueIndexAndResetRooms = (newVenueIndex) => {
    const newVenues = newVenueIndex > -1 ? [venues[newVenueIndex]] : venues;
    const ids = newVenues.flatMap((venue) => venue.rooms).map((room) => room.id);
    dispatchRooms({ type: 'reset', ids });

    setActiveVenueIndex(newVenueIndex);
  };

  return (
    <>
      {venueCount > 1 && (
        <Menu
          pointing
          secondary
          fluid
          stackable
          // TODO: can't scroll left when 6+ venues
          widths={Math.min(6, venueCount + 1)}
          style={{ overflowX: 'auto', overflowY: 'hidden' }}
        >
          <Menu.Item
            name="All Venues"
            active={activeVenueIndex === -1}
            onClick={() => setActiveVenueIndexAndResetRooms(-1)}
          />
          {venues.map((venue, index) => (
            <Menu.Item
              key={venue.id}
              name={venue.name}
              active={index === activeVenueIndex}
              onClick={() => setActiveVenueIndexAndResetRooms(index)}
            />
          ))}
        </Menu>
      )}

      <VenueInfo
        activeVenueOrNull={activeVenueOrNull}
        venueCount={venueCount}
        timeZoneCount={timeZoneCount}
      />

      {rooms.length > 1 && (
        <RoomSelector
          rooms={rooms}
          activeRoomIds={activeRoomIds}
          toggleRoom={(id) => dispatchRooms({ type: 'toggle', id })}
        />
      )}
    </>
  );
}

function RoomSelector({ rooms, activeRoomIds, toggleRoom }) {
  return (
    <Grid stackable columns={Math.min(4, rooms.length)}>
      {rooms.map(({ id, name, color }) => (
        <Grid.Column key={id}>
          <div
            style={{
              backgroundColor: color,
              opacity: activeRoomIds.includes(id) ? 1 : 0.5,
              border: 'solid black 1px',
              padding: '1em',
              height: '100%',
            }}
          >
            <Form.Checkbox
              label={
                // eslint-disable-next-line jsx-a11y/label-has-associated-control
                <label style={{ color: getTextColor(color) }}>{name}</label>
              }
              checked={activeRoomIds.includes(id)}
              onChange={() => toggleRoom(id)}
            />
          </div>
        </Grid.Column>
      ))}
    </Grid>
  );
}

function VenueInfo({ activeVenueOrNull, venueCount, timeZoneCount }) {
  const { name, timezone } = activeVenueOrNull || {};
  const latitude = toDegrees(activeVenueOrNull?.latitudeMicrodegrees);
  const longitude = toDegrees(activeVenueOrNull?.longitudeMicrodegrees);
  const mapLink = `https://google.com/maps/place/${latitude},${longitude}`;

  return (
    <Message>
      <Message.Content>
        {activeVenueOrNull ? (
          <p>
            You are viewing the schedule for
            {' '}
            <a target="_blank" href={mapLink} rel="noreferrer">
              {name}
            </a>
            {venueCount === 1
              ? ', the sole venue for this competition.'
              : `, one of ${venueCount} venues for this competition.`}
            {' '}
            This venue is in the time zone
            {' '}
            {timezone}
            {venueCount > 1 && timeZoneCount === 1
              ? ', as are all other venues for this competition.'
              : '.'}
          </p>
        ) : (
          <p>
            You are viewing the schedule for all
            {' '}
            {venueCount}
            {' '}
            venues at once.
          </p>
        )}
      </Message.Content>
    </Message>
  );
}
