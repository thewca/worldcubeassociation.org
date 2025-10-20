"use client";

import React, { useState } from "react";
import {
  Button,
  Heading,
  Alert,
  Box,
  Tabs,
  CheckboxGroup,
  CheckboxCard,
} from "@chakra-ui/react";
import { getTextColor } from "@/lib/wca/calendar";
import { useT } from "@/lib/i18n/useI18n";

import {
  toDegrees,
  type WcifRoom,
  type WcifVenue,
} from "@/lib/wca/wcif/activities";
import { LuGlobe } from "react-icons/lu";

interface VenuesAndRoomsProps {
  wcifVenues: WcifVenue[];
  activeVenue?: WcifVenue;
  activeVenueIndex: number;
  setActiveVenueIndex: (index: number) => void;
  rooms: WcifRoom[];
  activeRoomIds: number[];
  updateRooms: (newRooms: number[]) => void;
  toggleRoom: (roomId: number) => void;
  clearRooms: () => void;
  setActiveTimeZone: (tz: string) => void;
}

export default function VenuesAndRooms({
  wcifVenues,
  activeVenue,
  activeVenueIndex,
  setActiveVenueIndex,
  rooms,
  activeRoomIds,
  updateRooms,
  toggleRoom,
  clearRooms,
  setActiveTimeZone,
}: VenuesAndRoomsProps) {
  const venueCount = wcifVenues.length;

  const setActiveVenueIndexAndResetRooms = (newVenueIndex: number) => {
    const newVenues =
      newVenueIndex > -1 ? [wcifVenues[newVenueIndex]] : wcifVenues;

    const ids = newVenues
      .flatMap((venue) => venue.rooms)
      .map((room) => room.id);

    updateRooms(ids);
    setActiveVenueIndex(newVenueIndex);
  };

  const setTimeZoneForRoom = (roomId: number) => {
    const venueForRoom = wcifVenues.find((venue) =>
      venue.rooms.some((room) => room.id === roomId),
    );

    if (venueForRoom) {
      setActiveTimeZone(venueForRoom.timezone);
    }
  };

  const [showTimeZoneButton, setShowTimeZoneButton] = useState(false);

  const { t } = useT();

  return (
    <>
      {venueCount > 1 && (
        <Tabs.Root
          value={`${activeVenueIndex}`}
          onValueChange={(e) =>
            setActiveVenueIndexAndResetRooms(Number(e.value))
          }
        >
          <Tabs.List>
            <Tabs.Trigger value="-1">
              {t("competitions.schedule.all_venues")}
            </Tabs.Trigger>
            {wcifVenues.map((venue, index) => (
              <Tabs.Trigger key={venue.id} value={`${index}`}>
                {venue.name}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </Tabs.Root>
      )}

      <VenueInfo activeVenue={activeVenue} venueCount={venueCount} />

      {rooms.length > 1 && (
        <Box>
          <Heading size="sm">
            {t("competitions.schedule.rooms_panel.title")}{" "}
            <Button onClick={() => updateRooms(rooms.map((room) => room.id))}>
              {t("competitions.schedule.rooms_panel.all")}
            </Button>
            <Button onClick={() => clearRooms()}>
              {t("competitions.schedule.rooms_panel.none")}
            </Button>
            <Button
              onClick={() =>
                setShowTimeZoneButton((buttonState) => !buttonState)
              }
            >
              {t("competitions.schedule.rooms_panel.show_buttons")}
            </Button>
          </Heading>
          <RoomSelector
            rooms={rooms}
            activeRoomIds={activeRoomIds}
            toggleRoom={toggleRoom}
            setTimeZoneForRoom={setTimeZoneForRoom}
            showTimeZoneButton={showTimeZoneButton}
          />
        </Box>
      )}
    </>
  );
}

interface RoomSelectorProps {
  rooms: WcifRoom[];
  activeRoomIds: number[];
  toggleRoom: (roomId: number) => void;
  setTimeZoneForRoom: (roomId: number) => void;
  showTimeZoneButton: boolean;
}

function RoomSelector({
  rooms,
  activeRoomIds,
  toggleRoom,
  setTimeZoneForRoom,
  showTimeZoneButton,
}: RoomSelectorProps) {
  const { t } = useT();

  return (
    <CheckboxGroup columns={Math.min(4, rooms.length)}>
      {rooms.map(({ id, name, color }) => (
        <CheckboxCard.Root
          key={id}
          checked={activeRoomIds.includes(id)}
          onCheckedChange={() => toggleRoom(id)}
        >
          <CheckboxCard.HiddenInput />
          <CheckboxCard.Control
            backgroundColor={color}
            color={getTextColor(color)}
            opacity={activeRoomIds.includes(id) ? 1 : 0.5}
          >
            <CheckboxCard.Indicator />
            <CheckboxCard.Content>
              <CheckboxCard.Label>{name}</CheckboxCard.Label>
            </CheckboxCard.Content>
          </CheckboxCard.Control>
          {showTimeZoneButton && (
            <CheckboxCard.Addon>
              <Button onClick={() => setTimeZoneForRoom(id)}>
                <LuGlobe />
                {t("competitions.schedule.rooms_panel.use_time_zone")}
              </Button>
            </CheckboxCard.Addon>
          )}
        </CheckboxCard.Root>
      ))}
    </CheckboxGroup>
  );
}

interface VenueInfoProps {
  activeVenue?: WcifVenue;
  venueCount: number;
}

function VenueInfo({ activeVenue, venueCount }: VenueInfoProps) {
  const { t } = useT();

  if (activeVenue === undefined) {
    return (
      <Alert.Root status="info" colorPalette="gray">
        <Alert.Content>
          <Alert.Description>
            {t("competitions.schedule.venue_selection_all", {
              venueCount,
            })}
          </Alert.Description>
        </Alert.Content>
      </Alert.Root>
    );
  }

  const { name, timezone } = activeVenue || {};

  const latitude = toDegrees(activeVenue?.latitudeMicrodegrees);
  const longitude = toDegrees(activeVenue?.longitudeMicrodegrees);

  const mapLink = `https://google.com/maps/place/${latitude},${longitude}`;

  return (
    <Alert.Root status="info" colorPalette="gray">
      <Alert.Content>
        <Alert.Title>
          <p
            dangerouslySetInnerHTML={{
              __html: t("competitions.schedule.venue_selection_html", {
                venue_name: `<a target="_blank" href=${mapLink} rel="noreferrer">
                  ${name}
                </a>`,
                count: venueCount,
                interpolation: { escapeValue: false },
              }),
            }}
          />
        </Alert.Title>
        <Alert.Description>
          {t("competitions.schedule.timezone_message", {
            timezone,
            interpolation: { escapeValue: false },
          })}
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
}
