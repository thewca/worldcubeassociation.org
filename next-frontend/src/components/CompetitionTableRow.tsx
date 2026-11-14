"use client";
import React, { JSX, useState } from "react";
import {
  Table,
  Text,
  Link as ChakraLink,
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
}

const registrationStatusIcons: Record<RegistrationStatus, JSX.Element> = {
  open: <CompRegoNotFullOpenGreenIcon />,
  notOpen: <CompRegoNotOpenYetGreyIcon />,
  closed: <CompRegoClosedRedIcon />,
};

const CompetitionTableRow: React.FC<Props> = ({ comp }) => {
  const [open, setOpen] = useState(false);
  const regoStatus = getRegistrationStatus(comp);

  const isChampionship = comp.championship_types.length > 0;

  const { t } = useT();
  const lng = useLocale();
  return (
    <Table.Row key={comp.id}>
      <Table.Cell>{registrationStatusIcons[regoStatus]}</Table.Cell>

      <Table.Cell>
        <Text>{formatDateRange(comp.start_date, comp.end_date, lng)}</Text>
      </Table.Cell>

      <Table.Cell whiteSpace={{ base: "normal", md: "nowrap" }}>
        <HStack gap="2">
          <Box
            as="span"
            title={countryName(comp.country_iso2, t)}
            lineHeight="0"
            flexShrink="0"
          >
            <WcaFlag code={comp.country_iso2} size="lg" />
          </Box>
          {isChampionship && <NationalChampionshipIcon />}
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
