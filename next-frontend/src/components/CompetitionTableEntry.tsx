"use client";
import React, { JSX, useState } from "react";
import {
  Table,
  Text,
  Link as ChakraLink,
  Button,
  CloseButton,
  Drawer,
  Portal,
  Badge,
  VStack,
  Heading,
  Float,
  Icon,
  HStack,
} from "@chakra-ui/react";

import WcaFlag from "@/components/WcaFlag";

import CompRegoFullButOpenOrangeIcon from "@/components/icons/CompRegoFullButOpen_orangeIcon";
import CompRegoNotFullOpenGreenIcon from "@/components/icons/CompRegoNotFullOpen_greenIcon";
import CompRegoNotOpenYetGreyIcon from "@/components/icons/CompRegoNotOpenYet_greyIcon";
import CompRegoClosedRedIcon from "@/components/icons/CompRegoClosed_redIcon";

import CompRegoCloseDateIcon from "@/components/icons/CompRegoCloseDateIcon";
import CompetitorsIcon from "@/components/icons/CompetitorsIcon";
import RegisterIcon from "@/components/icons/RegisterIcon";
import LocationIcon from "@/components/icons/LocationIcon";
import NationalChampionshipIcon from "@/components/icons/NationalChampionshipIcon";

import EventIcon from "@/components/EventIcon";
import CountryMap from "@/components/CountryMap";

import type { components } from "@/types/openapi";
import Link from "next/link";
import { route } from "nextjs-routes";
import { useT } from "@/lib/i18n/useI18n";

// Raw competition type from WCA API
type CompetitionIndex = components["schemas"]["CompetitionIndex"];

interface Props {
  comp: CompetitionIndex;
}

// Map registration status
const getRegistrationStatus = (comp: CompetitionIndex): string => {
  const alreadyOpened = new Date(comp.registration_open) <= new Date();
  const notYetClosed = new Date(comp.registration_close) > new Date();

  const currentlyOpen = alreadyOpened && notYetClosed;

  if (currentlyOpen) {
    return "open";
  }

  if (!alreadyOpened) {
    return "notOpen";
  }

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

  const { t } = useT();
  return (
    <Table.Row bg="bg" onClick={() => setOpen(true)} key={comp.id}>
      <Table.Cell>{registrationStatusIcons[regoStatus] || null}</Table.Cell>

      <Table.Cell>
        <Text>{formatDateRange(comp.start_date, comp.end_date)}</Text>
      </Table.Cell>

      <Table.Cell>
        <ChakraLink asChild hoverArrow onClick={(e) => e.stopPropagation()}>
          <Link
            href={route({
              pathname: "/competitions/[competitionId]",
              query: { competitionId: comp.id },
            })}
          >
            {comp.name}
          </Link>
        </ChakraLink>
      </Table.Cell>

      <Table.Cell width="100%">
        <Text>{comp.city}</Text>
      </Table.Cell>

      <Table.Cell textAlign="right">
        <CountryMap code={comp.country_iso2} fontWeight="bold" t={t} />
      </Table.Cell>

      <Table.Cell minWidth="4em">
        <Icon size="lg">
          <WcaFlag code={comp.country_iso2} fallback={comp.country_iso2} />
        </Icon>
      </Table.Cell>

      <Drawer.Root open={open} onOpenChange={(e) => setOpen(e.open)} size="xl">
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner padding="4">
            <Drawer.Content
              overflow="hidden"
              borderRadius="wca"
              height="max-content"
            >
              {comp.championship_types.length > 0 && (
                <Float
                  placement="middle-end"
                  offsetX="20"
                  fontSize="21vw"
                  opacity="0.1"
                >
                  <NationalChampionshipIcon />
                </Float>
              )}
              <Drawer.Header>
                <Heading size="3xl">{comp.name}</Heading>
              </Drawer.Header>
              <Drawer.Body>
                <VStack alignItems="start">
                  <Badge variant="information" textStyle="md">
                    <Icon size="xl">
                      <WcaFlag
                        code={comp.country_iso2}
                        fallback={comp.country_iso2}
                      />
                    </Icon>
                    <CountryMap
                      code={comp.country_iso2}
                      t={t}
                      fontWeight="bold"
                    />{" "}
                    {comp.city}
                  </Badge>
                  <Badge variant="information" textStyle="md">
                    <CompRegoCloseDateIcon size="2xl" />
                    {formatDateRange(comp.start_date, comp.end_date)}
                  </Badge>
                  <Badge variant="information" textStyle="md">
                    <CompetitorsIcon />
                    {comp.competitor_limit} Competitor Limit
                  </Badge>
                  <Badge variant="information" textStyle="md">
                    <RegisterIcon />
                    {comp.competitor_limit} Spots Left
                  </Badge>
                  <Badge variant="information" textStyle="md">
                    <LocationIcon />
                    {comp.city}
                  </Badge>
                  <HStack paddingInline="1.5">
                    {comp.event_ids.map((eventId) => (
                      <EventIcon
                        eventId={eventId}
                        key={eventId}
                        boxSize="7"
                        color={
                          eventId === comp.main_event_id && eventId !== "333"
                            ? "green.1A"
                            : "currentColor"
                        }
                      />
                    ))}
                  </HStack>
                </VStack>
              </Drawer.Body>
              <Drawer.Footer justifyContent="space-between" width="full">
                {/* TODO: Only Show register button/link if registration is not full */}
                <Button variant="outline">Register Now</Button>
                <Button variant="solid" asChild>
                  <Link
                    href={route({
                      pathname: "/competitions/[competitionId]",
                      query: { competitionId: comp.id },
                    })}
                  >
                    View Competition
                  </Link>
                </Button>
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
