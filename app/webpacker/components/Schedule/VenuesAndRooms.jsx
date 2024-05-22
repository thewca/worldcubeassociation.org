import React, { useState } from 'react';
import {
  Button, Checkbox, Grid, Header,
  Menu, Message, Segment, Transition,
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
  setActiveTimeZone,
}) {
  const venueCount = venues.length;

  const setActiveVenueIndexAndResetRooms = (newVenueIndex) => {
    const newVenues = newVenueIndex > -1 ? [venues[newVenueIndex]] : venues;
    const ids = newVenues.flatMap((venue) => venue.rooms).map((room) => room.id);
    dispatchRooms({ type: 'reset', ids });

    setActiveVenueIndex(newVenueIndex);
  };

  const setTimeZoneForRoom = (roomId) => {
    const venueForRoom = venues.find((venue) => (
      venue.rooms.some((room) => room.id === roomId)
    ));

    if (venueForRoom) {
      setActiveTimeZone(venueForRoom.timezone);
    }
  };

  const [showTimeZoneButton, setShowTimeZoneButton] = useState(false);

  return (
    <>
      {venueCount > 1 && (
        <Menu
          borderless
          fluid
          stackable
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
        <Segment>
          <Header size="small">
            {i18n.t('competitions.schedule.rooms_panel.title')}
            {' '}
            <Button
              primary
              size="mini"
              content={i18n.t('competitions.schedule.rooms_panel.all')}
              onClick={() => dispatchRooms({ type: 'reset', ids: rooms.map((room) => room.id) })}
            />
            <Button
              size="mini"
              content={i18n.t('competitions.schedule.rooms_panel.none')}
              onClick={() => dispatchRooms({ type: 'reset' })}
            />
            <Button
              toggle
              size="mini"
              content={i18n.t('competitions.schedule.rooms_panel.show_buttons')}
              active={showTimeZoneButton}
              onClick={() => setShowTimeZoneButton((buttonState) => !buttonState)}
            />
          </Header>
          <RoomSelector
            rooms={rooms}
            activeRoomIds={activeRoomIds}
            toggleRoom={(id) => dispatchRooms({ type: 'toggle', id })}
            setTimeZoneForRoom={setTimeZoneForRoom}
            showTimeZoneButton={showTimeZoneButton}
          />
        </Segment>
      )}
    </>
  );
}

function RoomSelector({
  rooms,
  activeRoomIds,
  toggleRoom,
  setTimeZoneForRoom,
  showTimeZoneButton,
}) {
  return (
    <Grid stackable columns={Math.min(4, rooms.length)}>
      {rooms.map(({ id, name, color }) => (
        <Grid.Column key={id}>
          <Button
            as={Segment}
            padded
            fluid
            basic
            attached={showTimeZoneButton && 'top'}
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
          <Transition visible={showTimeZoneButton} animation="scale" duration={150}>
            <Button
              fluid
              basic
              attached="bottom"
              size="small"
              compact
              icon="globe"
              content={i18n.t('competitions.schedule.rooms_panel.use_time_zone')}
              onClick={() => setTimeZoneForRoom(id)}
              style={{ textAlign: 'right' }}
            />
          </Transition>
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
          <>
            {/* eslint-disable-next-line react/no-danger */}
            <p dangerouslySetInnerHTML={{
              __html: i18n.t('competitions.schedule.venue_selection_html', {
                venue_name: `<a target="_blank" href=${mapLink} rel="noreferrer">
                  ${name}
                </a>`,
                count: venueCount,
              }),
            }}
            />
            {i18n.t('competitions.schedule.timezone_message', { timezone })}
          </>
        ) : (
          <p>
            {i18n.t('competitions.schedule.venue_selection_all', { venueCount })}
          </p>

        )}
      </Message.Content>
    </Message>
  );
}
