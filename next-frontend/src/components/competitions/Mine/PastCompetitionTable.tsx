"use client";

import {
  DateTableCell,
  LocationTableCell,
  NameTableCell,
  ReportTableCell,
} from "./TableCells";
import { Alert, Table } from "@chakra-ui/react";
import I18nHTMLTranslate from "@/components/I18nHTMLTranslate";
import { Tooltip } from "@/components/ui/tooltip";
import { useT } from "@/lib/i18n/useI18n";
import { components } from "@/types/openapi";
import { AiFillCalendar, AiFillCheckCircle } from "react-icons/ai";

interface PastCompetitionsTableProps {
  competitions: components["schemas"]["MyCompetition"][];
  fallbackMessage?: { key: string; options?: Record<string, string> };
}

export default function PastCompetitionsTable({
  competitions,
  fallbackMessage = undefined,
}: PastCompetitionsTableProps) {
  const { t } = useT();

  if (competitions.length === 0 && fallbackMessage) {
    return (
      <Alert.Root status="info">
        <Alert.Title>
          <I18nHTMLTranslate
            i18nKey={fallbackMessage.key}
            options={fallbackMessage.options}
          />
        </Alert.Title>
      </Alert.Root>
    );
  }

  return (
    <Table.ScrollArea borderWidth="1px" maxW="100%" height="400px" rounded="md">
      <Table.Root stickyHeader>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>
              {t("competitions.competition_info.name")}
            </Table.ColumnHeader>
            <Table.ColumnHeader>
              {t("competitions.competition_info.location")}
            </Table.ColumnHeader>
            <Table.ColumnHeader>
              {t("competitions.competition_info.date")}
            </Table.ColumnHeader>
            <Table.ColumnHeader />
            <Table.ColumnHeader />
            <Table.ColumnHeader />
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {competitions.map((competition) => (
            <Table.Row key={competition.id}>
              <NameTableCell competition={competition} />
              <LocationTableCell competition={competition} />
              <DateTableCell competition={competition} />
              <Table.Cell>
                {!competition["results_posted?"] && <AiFillCalendar />}
              </Table.Cell>
              <Table.Cell>
                {competition["results_posted?"] && (
                  <Tooltip
                    content={t("competitions.my_competitions_table.results_up")}
                  >
                    <AiFillCheckCircle />
                  </Tooltip>
                )}
              </Table.Cell>
              <ReportTableCell
                competitionId={competition.id}
                isReportPosted={competition["report_posted?"]}
                isPastCompetition
              />
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
