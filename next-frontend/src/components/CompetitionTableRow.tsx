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
  IconButton,
  HStack,
  Box,
} from "@chakra-ui/react";

import WcaFlag from "@/components/WcaFlag";

import CompRegoNotFullOpenGreenIcon from "@/components/icons/CompRegoNotFullOpen_greenIcon";
import CompRegoNotOpenYetGreyIcon from "@/components/icons/CompRegoNotOpenYet_greyIcon";
import CompRegoClosedRedIcon from "@/components/icons/CompRegoClosed_redIcon";

import NationalChampionshipIcon from "@/components/icons/NationalChampionshipIcon";

import { countryName } from "@/components/CountryMap";
import { ChakraMarkdown } from "@/components/Markdown";

import type { components } from "@/types/openapi";
import Link from "next/link";
import { route } from "nextjs-routes";
import { useT } from "@/lib/i18n/useI18n";
import { formatDateRange } from "@/lib/dates/format";
import CompetitionShortlist from "@/components/competitions/CompetitionShortlist";
import { LuInfo } from "react-icons/lu";
import {
  getRegistrationStatus,
  type RegistrationStatus,
} from "@/lib/wca/competitions/statusUtils";

// Raw competition type from WCA API
type CompetitionIndex = components["schemas"]["CompetitionIndex"];

interface Props {
  comp: CompetitionIndex;
}

const registrationStatusIcons: Record<RegistrationStatus, JSX.Element> = {
  open: <CompRegoNotFullOpenGreenIcon />,
  notOpen: <CompRegoNotOpenYetGreyIcon />,
  closed: <CompRegoClosedRedIcon />,
};

const CompetitionTableRow: React.FC<Props> = ({ comp }) => {
  const [open, setOpen] = useState(false);
  const regoStatus = getRegistrationStatus(comp);

  const { t } = useT();
  return (
    <Table.Row key={comp.id}>
      <Table.Cell>{registrationStatusIcons[regoStatus]}</Table.Cell>

      <Table.Cell>
        <Text>{formatDateRange(comp.start_date, comp.end_date)}</Text>
      </Table.Cell>

      <Table.Cell whiteSpace={{ base: "normal", md: "nowrap" }}>
        <HStack gap="2">
          <Box
            as="span"
            title={countryName(comp.country_iso2, t)}
            lineHeight="0"
          >
            <WcaFlag code={comp.country_iso2} size="lg" />
          </Box>
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
        </HStack>
      </Table.Cell>

      <Table.Cell>
        <IconButton
          size="2xs"
          variant="ghost"
          color="currentColor"
          marginX="2"
          onClick={() => setOpen(true)}
        >
          <LuInfo />
        </IconButton>
      </Table.Cell>

      <Table.Cell hideBelow="md" whiteSpace="nowrap">
        <Text>
          <strong>{countryName(comp.country_iso2, t)}</strong>
          {`, ${comp.city}`}
        </Text>
      </Table.Cell>

      <Table.Cell width="100%" hideBelow="md">
        <Box lineClamp="1">
          <ChakraMarkdown paragraphAs={Text}>{comp.venue}</ChakraMarkdown>
        </Box>
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
                <CompetitionShortlist
                  comp={comp}
                  t={t}
                  items={[
                    "city",
                    "venue_address",
                    "start_date",
                    "event_ids",
                    "base_entry_fee_lowest_denomination",
                  ]}
                />
              </Drawer.Body>
              <Drawer.Footer justifyContent="space-between" width="full">
                {/* TODO: Only Show register button/link if registration is not full */}
                <Button variant="outline" asChild>
                  <Link
                    href={route({
                      pathname: "/competitions/[competitionId]/register",
                      query: { competitionId: comp.id },
                    })}
                  >
                    {t("competitions.index.register_now")}
                  </Link>
                </Button>
                <Button variant="solid" asChild>
                  <Link
                    href={route({
                      pathname: "/competitions/[competitionId]",
                      query: { competitionId: comp.id },
                    })}
                  >
                    {t("competitions.index.view_competition")}
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

export default CompetitionTableRow;
