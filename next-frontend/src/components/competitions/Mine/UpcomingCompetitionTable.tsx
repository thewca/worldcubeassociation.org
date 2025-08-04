import { DateTime } from "luxon";
import {
  DateTableCell,
  LocationTableCell,
  NameTableCell,
  ReportTableCell,
} from "./TableCells";
import { usePermissions } from "@/providers/PermissionProvider";
import { toRelativeOptions } from "@/lib/wca/dates";
import { TFunction } from "i18next";
import { SiCheckmarx, SiClockify } from "react-icons/si";
import UserIcon from "@/components/icons/UserIcon";
import I18nHTMLTranslate from "@/components/I18nHTMLTranslate";
import { AiFillHourglass } from "react-icons/ai";
import { BiSolidTrash } from "react-icons/bi";
import { Alert, Table } from "@chakra-ui/react";
import { useT } from "@/lib/i18n/useI18n";
import { Tooltip } from "@/components/ui/tooltip";

const competingStatusIcon = (competingStatus: string) => {
  switch (competingStatus) {
    case "pending":
      return <AiFillHourglass />;
    case "waiting_list":
      return <AiFillHourglass />;
    case "accepted":
      return <SiCheckmarx />;
    case "cancelled":
      return <BiSolidTrash />;
    case "rejected":
      return <BiSolidTrash />;
    default:
      return null;
  }
};

const registrationStatusIconText = (
  registrationOpen: string,
  registrationStatus: string,
  startDate: string,
  t: TFunction,
  locale: string,
) => {
  if (registrationStatus === "not_yet_opened") {
    return t("competitions.index.tooltips.registration.opens_in", {
      relativeDate: DateTime.fromISO(registrationOpen).toRelative(
        toRelativeOptions(locale).default,
      ),
    });
  }
  if (registrationStatus === "past") {
    return t("competitions.index.tooltips.registration.closed", {
      relativeDate: DateTime.fromISO(startDate).toRelative(
        toRelativeOptions(locale).roundUpAndAtBestDayPrecision,
      ),
    });
  }
  if (registrationStatus === "full") {
    return t("competitions.index.tooltips.registration.full");
  }
  return t("competitions.index.tooltips.registration.open");
};

const registrationStatusIcon = (registrationStatus: string) => {
  if (registrationStatus === "not_yet_opened") {
    return <SiClockify />;
  }
  if (registrationStatus === "past") {
    return <UserIcon />;
  }
  if (registrationStatus === "full") {
    return <SiClockify color="orange" />;
  }
  return <UserIcon color="green" />;
};

interface UpcomingCompetitionTableProps {
  competitions: {
    id: string;
    name: string;
    start_date: string;
    competing_status: string;
  }[];
  fallbackMessage?: { key: string; options: Record<string, string> };
}

export default function UpcomingCompetitionTable({
  competitions,
  fallbackMessage = undefined,
}: UpcomingCompetitionTableProps) {
  const { canViewDelegateReport, canAdministerCompetition } = usePermissions()!;
  const {
    t,
    i18n: { language: lng },
  } = useT();

  const canViewAnyReport = competitions.some((c) =>
    canViewDelegateReport(c.id),
  );
  const canAdminAVisibleComp = competitions.some((c) =>
    canAdministerCompetition(c.id),
  );

  if (competitions.length === 0 && fallbackMessage) {
    return (
      <Alert.Root status={"info"}>
        <Alert.Indicator></Alert.Indicator>
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
    <div style={{ overflowX: "auto" }}>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader />
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
            {canAdminAVisibleComp && (
              <>
                <Table.ColumnHeader />
                <Table.ColumnHeader />
              </>
            )}
            {canViewAnyReport && <Table.ColumnHeader />}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {competitions.map((competition) => {
            const canAdminThisComp = canAdministerCompetition(competition.id);

            return (
              <Tooltip
                key={competition.id}
                content={competitionStatusText(
                  competition,
                  competition.competing_status,
                )}
              >
                <Table.Row
                  positive={
                    competition["confirmed?"] && !competition["cancelled?"]
                  }
                  negative={!competition["visible?"]}
                >
                  <Tooltip
                    content={registrationStatusIconText(
                      competition.registration_open,
                      competition.registration_status,
                      competition.start_date,
                      t,
                      lng,
                    )}
                  >
                    <Table.Cell>
                      {registrationStatusIcon(competition.registration_status)}
                    </Table.Cell>
                  </Tooltip>
                  <NameTableCell competition={competition} />
                  <LocationTableCell competition={competition} />
                  <DateTableCell competition={competition} />
                  <Table.Cell>
                    {competingStatusIcon(competition.competing_status)}
                  </Table.Cell>
                  {canAdminThisComp && (
                    <Table.Cell>
                      <a href={`/competitions/${competition.id}/edit`}>
                        {t("competitions.my_competitions_table.edit")}
                      </a>
                    </Table.Cell>
                  )}
                  {canAdminThisComp ? (
                    <Table.Cell>
                      <a href={competitionEditRegistrationsUrl(competition.id)}>
                        {t("competitions.my_competitions_table.registrations")}
                      </a>
                    </Table.Cell>
                  ) : (
                    canAdminAVisibleComp && (
                      <>
                        <Table.Cell />
                        <Table.Cell />
                      </>
                    )
                  )}
                  {canViewAnyReport && (
                    <ReportTableCell
                      competitionId={competition.id}
                      isPastCompetition={false}
                      isReportPosted={false}
                    />
                  )}
                </Table.Row>
              </Tooltip>
            );
          })}
        </Table.Body>
      </Table.Root>
    </div>
  );
}
