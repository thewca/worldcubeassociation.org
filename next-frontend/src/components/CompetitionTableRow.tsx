"use client";
import React, { JSX, useState } from "react";
import {
  Table,
  Text,
  Link as ChakraLink,
  Button,
  CloseButton,
  Center,
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
  isRepeatedDate: boolean;
}

const COMPETITION_FLAG_SIZE = "1.2rem";

const registrationStatusIcons: Record<RegistrationStatus, JSX.Element> = {
  open: <CompRegoNotFullOpenGreenIcon />,
  notOpen: <CompRegoNotOpenYetGreyIcon />,
  closed: <CompRegoClosedRedIcon />,
};

const CompetitionTableRow: React.FC<Props> = ({ comp, isRepeatedDate }) => {
  const [open, setOpen] = useState(false);
  const regoStatus = getRegistrationStatus(comp);

  const isChampionship = comp.championship_types.length > 0;

  const dateLabel = formatDateRange(comp.start_date, comp.end_date);

  const { t } = useT();
  return (
    <Table.Row key={comp.id} height={{ base: "10", lg: "auto" }}>
      <Table.Cell width="10">
        <Center boxSize="10">{registrationStatusIcons[regoStatus]}</Center>
      </Table.Cell>

      <Table.Cell width="1" whiteSpace="nowrap" hideBelow="md">
        <Text opacity={isRepeatedDate ? 0.5 : 1}>{dateLabel}</Text>
      </Table.Cell>

      <Table.Cell width="1">
        <Box as="span" title={countryName(comp.country_iso2, t)} lineHeight="0">
          <WcaFlag
            code={comp.country_iso2}
            boxSize={COMPETITION_FLAG_SIZE}
            minW={COMPETITION_FLAG_SIZE}
          />
        </Box>
      </Table.Cell>

      <Table.Cell
        width={{ base: "full", lg: "auto" }}
        whiteSpace={{ base: "normal", lg: "nowrap" }}
        overflowWrap={{ base: "anywhere", lg: "normal" }}
      >
        <Box minW="0">
          <HStack gap="1" minW="0">
            <ChakraLink asChild minW="0">
              <Link
                href={route({
                  pathname: "/competitions/[competitionId]",
                  query: { competitionId: comp.id },
                })}
              >
                {comp.name}
              </Link>
            </ChakraLink>
            {isChampionship && <NationalChampionshipIcon flexShrink="0" />}
          </HStack>
          <Text hideFrom="lg" color="fg.muted" textStyle="xs">
            <Box as="span" hideFrom="md">
              {dateLabel}
              {" – "}
            </Box>
            {comp.city}
          </Text>
        </Box>
      </Table.Cell>

      <Table.Cell width="10">
        <IconButton
          size="2xs"
          boxSize="10"
          variant="ghost"
          color="currentColor"
          aria-label={t("competitions.competition_info.details")}
          onClick={() => setOpen(true)}
        >
          <LuInfo />
        </IconButton>
      </Table.Cell>

      <Table.Cell hideBelow="lg" width="2/3" maxW="0">
        <Text truncate>
          <strong>{countryName(comp.country_iso2, t)}</strong>
          {`, ${comp.city}`}
        </Text>
      </Table.Cell>

      <Table.Cell width="1/3" maxW="0" hideBelow="lg">
        <Box lineClamp="1">
          <ChakraMarkdown paragraphAs={Text}>{comp.venue}</ChakraMarkdown>
        </Box>
      </Table.Cell>

      <Drawer.Root open={open} onOpenChange={(e) => setOpen(e.open)} size="xl">
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner padding="4" alignItems="center">
            <Drawer.Content
              overflow="hidden"
              borderRadius="wca"
              height="max-content"
            >
              {isChampionship && (
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
