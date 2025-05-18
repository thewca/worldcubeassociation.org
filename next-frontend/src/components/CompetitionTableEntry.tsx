"use client";
import React, { useState } from "react";
import {
  Table,
  Text,
  Link,
  Button,
  CloseButton,
  Drawer,
  Portal,
  Badge,
  VStack,
} from "@chakra-ui/react";

import Flag from "react-world-flags";

import CompRegoFullButOpenOrangeIcon from "@/components/icons/CompRegoFullButOpen_orangeIcon";
import CompRegoNotFullOpenGreenIcon from "@/components/icons/CompRegoNotFullOpen_greenIcon";
import CompRegoNotOpenYetGreyIcon from "@/components/icons/CompRegoNotOpenYet_greyIcon";
import CompRegoClosedRedIcon from "@/components/icons/CompRegoClosed_redIcon";

import CompRegoCloseDateIcon from "@/components/icons/CompRegoCloseDateIcon";
import CompetitorsIcon from "@/components/icons/CompetitorsIcon";
import RegisterIcon from "@/components/icons/RegisterIcon";
import LocationIcon from "@/components/icons/LocationIcon";

import EventIcon from "@/components/EventIcon";
import CountryMap from "@/components/CountryMap";

// Raw competition type from WCA API
interface WCACompetition {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  city: string;
  country_iso2: string;
  registration_open: string | null;
  registration_close: string | null;
  registration_currently_open: boolean;
  competitor_limit: number;
  event_ids: string[];
  main_event_id: string;
}

interface Props {
  comp: WCACompetition;
}

// Map registration status
const getRegistrationStatus = (comp: WCACompetition): string => {
  if (comp.registration_currently_open) {
    if (comp.competitor_limit === 0) return "open";
    return "open";
  }
  if (new Date(comp.registration_open ?? "") > new Date()) return "notOpen";
  return "closed";
};

const registrationStatusIcons: Record<string, JSX.Element> = {
  open: <CompRegoNotFullOpenGreenIcon />,
  notOpen: <CompRegoNotOpenYetGreyIcon />,
  closed: <CompRegoClosedRedIcon />,
  full: <CompRegoFullButOpenOrangeIcon />,
};

// Format date range
function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const sameDay = startDate.toDateString() === endDate.toDateString();

  const dayFormatter = new Intl.DateTimeFormat("en-US", { day: "numeric" });
  const monthDayFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  const fullFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (sameDay) return fullFormatter.format(startDate);

  const sameMonth = startDate.getMonth() === endDate.getMonth();
  const sameYear = startDate.getFullYear() === endDate.getFullYear();

  if (sameMonth && sameYear) {
    return `${monthDayFormatter.format(startDate)} - ${dayFormatter.format(endDate)}, ${startDate.getFullYear()}`;
  }

  if (sameYear) {
    return `${monthDayFormatter.format(startDate)} - ${monthDayFormatter.format(endDate)}, ${startDate.getFullYear()}`;
  }

  return `${fullFormatter.format(startDate)} - ${fullFormatter.format(endDate)}`;
}

const CompetitionTableEntry: React.FC<Props> = ({ comp }) => {
  const [open, setOpen] = useState(false);
  const regoStatus = getRegistrationStatus(comp);

  return (
    <Table.Row bg="bg.inverted" onClick={() => setOpen(true)} key={comp.id}>
      <Table.Cell>{registrationStatusIcons[regoStatus] || null}</Table.Cell>

      <Table.Cell>
        <Text>{formatDateRange(comp.start_date, comp.end_date)}</Text>
      </Table.Cell>

      <Table.Cell>
        <Link
          hoverArrow
          href={`/competitions/${comp.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          {comp.name}
        </Link>
      </Table.Cell>

      <Table.Cell>
        <Text>{comp.city}</Text>
      </Table.Cell>

      <Table.Cell>
        <CountryMap code={comp.country_iso2} bold />
      </Table.Cell>

      <Table.Cell>
        <Flag code={comp.country_iso2} fallback={comp.country_iso2} />
      </Table.Cell>

      <Drawer.Root
        open={open}
        onOpenChange={(e) => setOpen(e.open)}
        variant="competitionInfo"
        size="xl"
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner padding="4">
            <Drawer.Content>
              <Drawer.Header>
                <Drawer.Title>{comp.name}</Drawer.Title>
              </Drawer.Header>
              <Drawer.Body>
                <VStack alignItems="start">
                  <Badge variant="information">
                    <Flag
                      code={comp.country_iso2}
                      fallback={comp.country_iso2}
                    />
                    <CountryMap code={comp.country_iso2} bold /> {comp.city}
                  </Badge>
                  <Badge variant="information">
                    <CompRegoCloseDateIcon />
                    {formatDateRange(comp.start_date, comp.end_date)}
                  </Badge>
                  <Badge variant="information">
                    <CompetitorsIcon />
                    {comp.competitor_limit} Competitor Limit
                  </Badge>
                  <Badge variant="information">
                    <RegisterIcon />
                    {comp.competitor_limit} Spots Left
                  </Badge>
                  <Badge variant="information">
                    <LocationIcon />
                    {comp.city}
                  </Badge>
                </VStack>
                <Text>Events:</Text>
                {comp.event_ids.map((eventId) => (
                  <EventIcon
                    eventId={eventId}
                    key={eventId}
                    main={eventId === comp.main_event_id}
                  />
                ))}
              </Drawer.Body>
              <Drawer.Footer>
                <Button variant="outline">Register Now</Button>
                <Button variant="solid">View Competition</Button>
              </Drawer.Footer>
              <Drawer.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Drawer.CloseTrigger>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </Table.Row>
  );
};

export default CompetitionTableEntry;
