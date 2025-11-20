import countries from "@/lib/wca/data/countries";
import { HStack, IconButton, Table } from "@chakra-ui/react";
import { AiFillFileImage, AiFillTrophy } from "react-icons/ai";
import { useT } from "@/lib/i18n/useI18n";
import EditIcon from "@/components/icons/EditIcon";
import { WarningIcon } from "@payloadcms/ui";
import { Tooltip } from "@/components/ui/tooltip";
import { dateRange } from "@/lib/wca/dates";
import { components } from "@/types/openapi";
import { usePermissionsQuery } from "@/lib/hooks/usePermissionsQuery";

interface TableCellProps {
  competition: components["schemas"]["MyCompetition"];
}

export function NameTableCell({ competition }: TableCellProps) {
  return (
    <Table.Cell>
      <HStack>
        <a href={competition.url}>{competition.short_display_name}</a>
        {(competition.championships?.length ?? 0) > 0 && <AiFillTrophy />}
      </HStack>
    </Table.Cell>
  );
}

export function LocationTableCell({ competition }: TableCellProps) {
  return (
    <Table.Cell>
      {competition.city}
      {`, ${countries.byIso2[competition.country_iso2].name}`}
    </Table.Cell>
  );
}

export function DateTableCell({ competition }: TableCellProps) {
  return (
    <Table.Cell>
      {dateRange(competition.start_date, competition.end_date, {
        separator: "-",
      })}
    </Table.Cell>
  );
}

interface ReportTableCellProps {
  competitionId: string;
  isReportPosted: boolean;
  isPastCompetition: boolean;
}

export function ReportTableCell({
  competitionId,
  isReportPosted,
  isPastCompetition,
}: ReportTableCellProps) {
  const { t } = useT();

  const { data: permissions, isLoading } = usePermissionsQuery();

  if (isLoading || !permissions) {
    return <Table.Cell />;
  }

  const {
    canViewDelegateReport,
    canEditDelegateReport,
    canAdministerCompetition,
  } = permissions;

  if (!canViewDelegateReport(competitionId)) {
    return <Table.Cell />;
  }

  return (
    <Table.Cell>
      <HStack>
        <Tooltip content={t("competitions.my_competitions_table.report")}>
          <a href={`/competitions/${competitionId}/report`}>
            <AiFillFileImage />
          </a>
        </Tooltip>

        {!isReportPosted && canEditDelegateReport(competitionId) && (
          <Tooltip
            content={t("competitions.my_competitions_table.edit_report")}
          >
            <IconButton asChild variant="ghost">
              <a href={`/competitions/${competitionId}/report/edit`}>
                <EditIcon />
              </a>
            </IconButton>
          </Tooltip>
        )}

        {isPastCompetition &&
          !isReportPosted &&
          canAdministerCompetition(competitionId) && (
            <Tooltip
              content={t("competitions.my_competitions_table.missing_report")}
            >
              <WarningIcon />
            </Tooltip>
          )}
      </HStack>
    </Table.Cell>
  );
}
