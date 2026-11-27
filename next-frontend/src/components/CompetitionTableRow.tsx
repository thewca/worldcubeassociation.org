"use client";
import React, { JSX, useState } from "react";
import {
  Table,
  Text,
  Link as ChakraLink,
  Center,
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
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { LuInfo } from "react-icons/lu";
import {
  getRegistrationStatus,
  type RegistrationStatus,
} from "@/lib/wca/competitions/statusUtils";
import FlyoutDrawer from "./competitions/FlyoutDrawer";

// Raw competition type from WCA API
type CompetitionIndex = components["schemas"]["CompetitionIndex"];

interface Props {
  comp: CompetitionIndex;
  isRepeatedDate: boolean;
}

const registrationStatusIcons: Record<RegistrationStatus, JSX.Element> = {
  open: <CompRegoNotFullOpenGreenIcon />,
  notOpen: <CompRegoNotOpenYetGreyIcon />,
  closed: <CompRegoClosedRedIcon />,
  all: <></>,
};

const CompetitionTableRow: React.FC<Props> = ({ comp, isRepeatedDate }) => {
  const [open, setOpen] = useState(false);
  const regoStatus = getRegistrationStatus(comp);

  const isChampionship = comp.championship_types.length > 0;

  const { t } = useT();
  const lng = useLocale();
  const dateLabel = formatDateRange(comp.start_date, comp.end_date, lng);

  return (
    <Table.Row key={comp.id} height={{ base: "10", lg: "auto" }}>
      <Table.Cell width="7">
        <Center boxSize="7">{registrationStatusIcons[regoStatus]}</Center>
      </Table.Cell>

      <Table.Cell width="1" whiteSpace="nowrap" hideBelow="md">
        <Text color={isRepeatedDate ? "fg.muted" : undefined}>{dateLabel}</Text>
      </Table.Cell>

      <Table.Cell width="1">
        <Box as="span" title={countryName(comp.country_iso2, t)} lineHeight="0">
          <WcaFlag code={comp.country_iso2} size="md" minW="5" />
        </Box>
      </Table.Cell>

      <Table.Cell
        width={{ base: "full", lg: "auto" }}
        whiteSpace={{ base: "normal", lg: "nowrap" }}
        overflowWrap={{ base: "anywhere", lg: "normal" }}
      >
        <HStack gap="2" minW="0">
          <Box minW="0">
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
            <Text hideFrom="lg" color="fg.muted" textStyle="xs">
              <Box as="span" hideFrom="md">
                {t("competitions.index.date_and_city", {
                  date: dateLabel,
                  city: comp.city,
                })}
              </Box>
              <Box as="span" hideBelow="md">
                {comp.city}
              </Box>
            </Text>
          </Box>
          {isChampionship && <NationalChampionshipIcon flexShrink="0" />}
        </HStack>
      </Table.Cell>

      <Table.Cell width="7">
        <IconButton
          size="2xs"
          boxSize="7"
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

      <Table.Cell width="1/3" maxW="0" hideBelow="xl">
        <Box lineClamp="1">
          <ChakraMarkdown paragraphAs={Text}>{comp.venue}</ChakraMarkdown>
        </Box>
      </Table.Cell>

      <FlyoutDrawer
        open={open}
        setOpen={setOpen}
        comp={comp}
        isChampionship={isChampionship}
      />
    </Table.Row>
  );
};

export default CompetitionTableRow;
