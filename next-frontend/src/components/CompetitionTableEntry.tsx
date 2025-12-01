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
  Heading,
  Float,
  Icon,
} from "@chakra-ui/react";

import WcaFlag from "@/components/WcaFlag";

import CompRegoFullButOpenOrangeIcon from "@/components/icons/CompRegoFullButOpen_orangeIcon";
import CompRegoNotFullOpenGreenIcon from "@/components/icons/CompRegoNotFullOpen_greenIcon";
import CompRegoNotOpenYetGreyIcon from "@/components/icons/CompRegoNotOpenYet_greyIcon";
import CompRegoClosedRedIcon from "@/components/icons/CompRegoClosed_redIcon";

import NationalChampionshipIcon from "@/components/icons/NationalChampionshipIcon";

import CountryMap from "@/components/CountryMap";

import type { components } from "@/types/openapi";
import Link from "next/link";
import { route } from "nextjs-routes";
import { useT } from "@/lib/i18n/useI18n";
import { formatDateRange } from "@/lib/dates/format";
import CompetitionShortlist from "@/components/competitions/CompetitionShortlist";

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

const CompetitionTableEntry: React.FC<Props> = ({ comp }) => {
  const [open, setOpen] = useState(false);
  const regoStatus = getRegistrationStatus(comp);

  const { t } = useT();
  return (
    <Table.Row onClick={() => setOpen(true)} key={comp.id}>
      <Table.Cell>{registrationStatusIcons[regoStatus] || null}</Table.Cell>

      <Table.Cell>
        <Text>{formatDateRange(comp.start_date, comp.end_date)}</Text>
      </Table.Cell>

      <Table.Cell>
        <ChakraLink asChild>
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
                <CompetitionShortlist comp={comp} t={t} />
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
