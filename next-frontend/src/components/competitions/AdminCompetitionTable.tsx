"use client";

import {
  Avatar,
  Button,
  HStack,
  Link as ChakraLink,
  List,
  Table,
  Text,
} from "@chakra-ui/react";
import Link from "next/link";
import { route } from "nextjs-routes";
import { Duration } from "luxon";
import { TFunction } from "i18next";
import WcaFlag from "@/components/WcaFlag";
import RailsLink from "@/components/RailsLink";
import { countryName } from "@/components/CountryMap";
import { registrationStatusIcons } from "@/components/CompetitionTableRow";
import { useT } from "@/lib/i18n/useI18n";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { formatDateRange } from "@/lib/dates/format";
import { hasPassedEndOfDay } from "@/lib/wca/dates";
import { toAvatarName } from "@/lib/utils";
import { getRegistrationStatus } from "@/lib/wca/competitions/statusUtils";
import {
  announcementStatus,
  daysAfterEnd,
  daysBeforeStart,
  postingStatus,
  type AdminStatus,
} from "@/lib/wca/competitions/adminStatusUtils";
import type { components } from "@/types/openapi";

type AdminCompetition = components["schemas"]["AdminCompetitionIndex"];

const statusCellProps: Record<
  AdminStatus,
  { colorPalette: string; color?: string }
> = {
  ok: { colorPalette: "green" },
  semi_ok: { colorPalette: "green", color: "fg.muted" },
  warning: { colorPalette: "yellow" },
  danger: { colorPalette: "red" },
};

function StatusCell({
  status,
  children,
}: {
  status?: AdminStatus;
  children: React.ReactNode;
}) {
  const statusProps = status && {
    ...statusCellProps[status],
    bg: "colorPalette.subtle",
  };

  return (
    <Table.Cell textAlign="center" whiteSpace="nowrap" {...statusProps}>
      {children}
    </Table.Cell>
  );
}

const formatDays = (days: number, lng: string) =>
  Duration.fromObject({ days }, { locale: lng }).toHuman();

function postedCellContent(
  competition: AdminCompetition,
  postedAt: string | null,
  isPostedByOther: boolean,
  t: TFunction,
  lng: string,
) {
  if (postedAt) {
    return isPostedByOther
      ? t("competitions.competition_info.submitted_by_other")
      : t("competitions.competition_info.relative_days.after", {
          amount_of_days: formatDays(daysAfterEnd(competition, postedAt), lng),
        });
  }

  return hasPassedEndOfDay(competition.end_date)
    ? t("competitions.competition_info.pending")
    : null;
}

function AdminCompetitionRow({
  competition,
  selectedDelegateId,
}: {
  competition: AdminCompetition;
  selectedDelegateId?: number;
}) {
  const { t } = useT();
  const lng = useLocale();

  const delegateIds = competition.delegates.map((delegate) => delegate.id);
  const isReportPostedByOther =
    competition.report_posted_by_user !== null &&
    !delegateIds.includes(competition.report_posted_by_user);

  const announcedLabel =
    competition.announced_at &&
    t("competitions.competition_info.relative_days.before", {
      amount_of_days: formatDays(
        daysBeforeStart(competition, competition.announced_at),
        lng,
      ),
    });

  return (
    <Table.Row>
      <Table.Cell width="10">
        {registrationStatusIcons[getRegistrationStatus(competition)]}
      </Table.Cell>
      <Table.Cell>
        <HStack gap="2">
          <WcaFlag code={competition.country_iso2} size="md" />
          <ChakraLink asChild>
            <Link
              href={route({
                pathname: "/competitions/[competitionId]",
                query: { competitionId: competition.id },
              })}
            >
              {competition.short_display_name}
            </Link>
          </ChakraLink>
        </HStack>
        <Text>
          <strong>{countryName(competition.country_iso2, t)}</strong>
          {`, ${competition.city}`}
        </Text>
      </Table.Cell>
      <Table.Cell>
        <List.Root variant="plain" gap="1">
          {competition.delegates.map((delegate) => (
            <List.Item
              key={delegate.id}
              alignItems="center"
              gap="2"
              fontWeight={
                delegate.id === competition.lead_delegate_id
                  ? "bold"
                  : undefined
              }
              color={
                selectedDelegateId && delegate.id !== selectedDelegateId
                  ? "fg.muted"
                  : undefined
              }
            >
              <Avatar.Root size="2xs">
                <Avatar.Fallback name={toAvatarName(delegate.name)} />
                <Avatar.Image src={delegate.avatar.thumb_url} />
              </Avatar.Root>
              {delegate.name}
            </List.Item>
          ))}
        </List.Root>
      </Table.Cell>
      <Table.Cell textAlign="center" whiteSpace="nowrap">
        {formatDateRange(competition.start_date, competition.end_date, lng)}
      </Table.Cell>
      <StatusCell status={announcementStatus(competition)}>
        {announcedLabel}
      </StatusCell>
      <StatusCell
        status={postingStatus(competition, competition.report_posted_at)}
      >
        {postedCellContent(
          competition,
          competition.report_posted_at,
          isReportPostedByOther,
          t,
          lng,
        )}
      </StatusCell>
      <StatusCell
        status={postingStatus(competition, competition.results_submitted_at)}
      >
        {postedCellContent(
          competition,
          competition.results_submitted_at,
          false,
          t,
          lng,
        )}
      </StatusCell>
      <Table.Cell>
        <Button asChild size="xs" variant="outline">
          <RailsLink
            href={`/competitions/${competition.id}/edit/admin`}
            target="_blank"
          >
            {t("competitions.my_competitions_table.edit")}
          </RailsLink>
        </Button>
      </Table.Cell>
    </Table.Row>
  );
}

export default function AdminCompetitionTable({
  competitions,
  selectedDelegateId,
}: {
  competitions: AdminCompetition[];
  selectedDelegateId?: number;
}) {
  const { t } = useT();

  return (
    <Table.ScrollArea>
      <Table.Root size="sm" striped stickyHeader>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader />
            <Table.ColumnHeader>
              {t("competitions.competition_info.name_and_location")}
            </Table.ColumnHeader>
            <Table.ColumnHeader>
              {t("competitions.competition_info.delegates")}
            </Table.ColumnHeader>
            <Table.ColumnHeader textAlign="center">
              {t("competitions.competition_info.date")}
            </Table.ColumnHeader>
            <Table.ColumnHeader textAlign="center">
              {t("competitions.competition_info.announced")}
            </Table.ColumnHeader>
            <Table.ColumnHeader textAlign="center">
              {t("competitions.competition_info.report_posted")}
            </Table.ColumnHeader>
            <Table.ColumnHeader textAlign="center">
              {t("competitions.competition_info.results_submitted")}
            </Table.ColumnHeader>
            <Table.ColumnHeader />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {competitions.map((competition) => (
            <AdminCompetitionRow
              key={competition.id}
              competition={competition}
              selectedDelegateId={selectedDelegateId}
            />
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
