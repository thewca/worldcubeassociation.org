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
} from "@chakra-ui/react";

import CompRegoFullButOpenOrangeIcon from "@/components/icons/CompRegoFullButOpen_orangeIcon";
import CompRegoNotFullOpenGreenIcon from "@/components/icons/CompRegoNotFullOpen_greenIcon";
import CompRegoNotOpenYetGreyIcon from "@/components/icons/CompRegoNotOpenYet_greyIcon";
import CompRegoClosedRedIcon from "@/components/icons/CompRegoClosed_redIcon";

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
    return "open"; // You can enhance with full/open state if API supports it
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
        <Text>{comp.country_iso2}</Text>
      </Table.Cell>

      <Drawer.Root
        open={open}
        onOpenChange={(e) => setOpen(e.open)}
        variant="competitionInfo"
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner padding="4">
            <Drawer.Content>
              <Drawer.Header>
                <Drawer.Title>{comp.name}</Drawer.Title>
              </Drawer.Header>
              <Drawer.Body>
                <Text>Competitor Limit: {comp.competitor_limit}</Text>
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
                <Button variant="outline">Cancel</Button>
                <Button>Save</Button>
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
