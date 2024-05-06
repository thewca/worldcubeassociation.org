import React from 'react';
import {
  Button, Checkbox,
  Grid, Menu, Message, Segment,
} from 'semantic-ui-react';
import { getTextColor, TEXT_WHITE } from '../../lib/utils/calendar';
import { toDegrees } from '../../lib/utils/edit-schedule';
import i18n from '../../lib/i18n';

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
            name={i18n.t('competitions.schedule.all_venues')}
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
          <Button
            as={Segment}
            padded
            fluid
            basic
            inverted={getTextColor(color) === TEXT_WHITE}
            style={{
              backgroundColor: color,
              opacity: activeRoomIds.includes(id) ? 1 : 0.5,
            }}
            onClick={() => toggleRoom(id)}
          >
            <Checkbox
              as={Segment}
              basic
              floated="left"
              checked={activeRoomIds.includes(id)}
              readOnly
            />
            {name}
          </Button>
        </Grid.Column>
      ))}
    </Grid>
  );
}

function VenueInfo({ activeVenueOrNull, venueCount }) {
  const { name, timezone } = activeVenueOrNull || {};
  const latitude = toDegrees(activeVenueOrNull?.latitudeMicrodegrees);
  const longitude = toDegrees(activeVenueOrNull?.longitudeMicrodegrees);
  const mapLink = `https://google.com/maps/place/${latitude},${longitude}`;

  return (
    <Message>
      <Message.Content>
        {activeVenueOrNull ? (
          <p>
            {/* eslint-disable-next-line react/no-danger */}
            <p dangerouslySetInnerHTML={{
              __html: i18n.t('competitions.schedule.venue_information_html', {
                venue_name: `<a target="_blank" href=${mapLink} rel="noreferrer">
                  ${name}
                </a>`,
                count: venueCount,
              }),
            }}
            />
            {i18n.t('competitions.schedule.timezone_message', { timezone })}
          </p>
        ) : (
          <p>
            {i18n.t('competitions.schedule.venue_information_all', { venueCount })}
          </p>
        )}
      </Message.Content>
    </Message>
  );
}
