import {
  Card,
  FormatNumber,
  Heading,
  SimpleGrid,
  Text,
  Stat,
  Wrap,
} from "@chakra-ui/react";
import BookmarkIcon from "@/components/icons/BookmarkIcon";
import CompRegoOpenDateIcon from "@/components/icons/CompRegoOpenDateIcon";
import LocationIcon from "@/components/icons/LocationIcon";
import CountryMap from "@/components/CountryMap";
import CompetitorsIcon from "@/components/icons/CompetitorsIcon";
import { components } from "@/types/openapi";
import { TFunction } from "i18next";
import { getT } from "@/lib/i18n/get18n";
import CurrencyValue from "@/components/CurrencyValue";
import PaymentIcon from "@/components/icons/PaymentIcon";
import SpotsLeftIcon from "@/components/icons/SpotsLeftIcon";
import SpectatorsIcon from "@/components/icons/SpectatorsIcon";
import OnTheSpotRegistrationIcon from "@/components/icons/OnTheSpotRegistrationIcon";
import CompRegoCloseDateIcon from "@/components/icons/CompRegoCloseDateIcon";
import { LabelledEventIcon } from "@/components/EventIcon";
import { ChakraMarkdown } from "@/components/Markdown";
import VenueIcon from "@/components/icons/VenueIcon";
import MapIcon from "@/components/icons/MapIcon";
import DetailsIcon from "@/components/icons/DetailsIcon";
import LocalDateTime from "@/components/LocalDateTime";
import RefundPolicyText from "@/components/competitions/RefundPolicyText";
import BookmarkButton from "@/components/competitions/BookmarkButton";
import { hasNotPassed, hasPassed } from "@/lib/wca/dates";

function formatDateRange(start: Date, end: Date): string {
  const sameDay = start.toDateString() === end.toDateString();

  // Formatters
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

  if (sameDay) {
    return fullFormatter.format(start);
  }

  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();

  if (sameMonth && sameYear) {
    return `${monthDayFormatter.format(start)} - ${dayFormatter.format(end)}, ${start.getFullYear()}`;
  }

  if (sameYear) {
    return `${monthDayFormatter.format(start)} - ${monthDayFormatter.format(end)}, ${start.getFullYear()}`;
  }

  return `${fullFormatter.format(start)} - ${fullFormatter.format(end)}`;
}

export function AdditionalInformationCard({
  competitionInfo,
}: {
  competitionInfo: components["schemas"]["CompetitionInfo"];
}) {
  return (
    <Card.Root>
      <Card.Body>
        <Card.Title textStyle="s4">Information</Card.Title>
        <ChakraMarkdown
          paragraphAs={Card.Description}
          imageProps={{ maxW: { base: "full", md: "sm" } }}
          listProps={{ textStyle: "body" }}
          textStyle="body"
        >
          {competitionInfo.information}
        </ChakraMarkdown>
      </Card.Body>
    </Card.Root>
  );
}

export function RefundPolicyCard({
  competitionInfo,
}: {
  competitionInfo: components["schemas"]["CompetitionInfo"];
}) {
  return (
    <Card.Root>
      <Card.Body>
        <Card.Title textStyle="s4">Refund Policy</Card.Title>
        <Card.Description>
          <RefundPolicyText
            refundPolicyPercent={competitionInfo.refund_policy_percent}
            refundPolicyLimitDate={competitionInfo.refund_policy_limit_date}
          />
        </Card.Description>
      </Card.Body>
    </Card.Root>
  );
}

export async function RegistrationCard({
  competitionInfo,
  columns = 2,
}: {
  competitionInfo: components["schemas"]["CompetitionInfo"];
  columns?: number;
}) {
  const { t } = await getT();

  const registrationNotYetOpen = hasNotPassed(
    competitionInfo.registration_open,
  );
  const registrationClosed = hasPassed(competitionInfo.registration_close);
  const hasRegistrations = competitionInfo.accepted_registration_count > 0;
  const showCompetitorCount =
    hasRegistrations ||
    (competitionInfo.use_wca_registration && !registrationNotYetOpen);
  const hasCompetitorLimit = competitionInfo.spots_left != null;
  const showWaitingList =
    competitionInfo["registration_full?"] &&
    !registrationNotYetOpen &&
    !registrationClosed;

  return (
    <Card.Root>
      <Card.Body>
        <Card.Title textStyle="s4">
          {t("competitions.nav.menu.registration")}
        </Card.Title>
        <SimpleGrid columns={columns} gap="4">
          <Stat.Root variant="competition">
            <Stat.Label>
              <PaymentIcon />
              {t(
                "competitions.competition_form.labels.entry_fees.base_entry_fee",
              )}
            </Stat.Label>
            <Stat.ValueText>
              <CurrencyValue
                lowestDenomination={
                  competitionInfo.base_entry_fee_lowest_denomination
                }
                currencyCode={competitionInfo.currency_code}
              />
            </Stat.ValueText>
          </Stat.Root>

          <Stat.Root variant="competition">
            <Stat.Label>
              <SpotsLeftIcon />
              {showCompetitorCount
                ? t("competitions.nav.menu.competitors")
                : t("competitions.competition_info.competitor_limit")}
            </Stat.Label>
            <Stat.ValueText>
              {showCompetitorCount ? (
                <>
                  <FormatNumber
                    value={competitionInfo.accepted_registration_count}
                  />
                  {hasCompetitorLimit && (
                    <>
                      {" / "}
                      <FormatNumber value={competitionInfo.competitor_limit} />
                    </>
                  )}
                </>
              ) : hasCompetitorLimit ? (
                <FormatNumber value={competitionInfo.competitor_limit} />
              ) : (
                t("competitions.competition_info.no_competitor_limit")
              )}
            </Stat.ValueText>
          </Stat.Root>

          <Stat.Root variant="competition">
            <Stat.Label>
              <SpectatorsIcon />
              {t(
                "competitions.competition_form.labels.entry_fees.guest_entry_fee",
              )}
            </Stat.Label>
            <Stat.ValueText>
              {competitionInfo.guests_entry_fee_lowest_denomination ? (
                <CurrencyValue
                  lowestDenomination={
                    competitionInfo.guests_entry_fee_lowest_denomination
                  }
                  currencyCode={competitionInfo.currency_code}
                />
              ) : (
                t("competitions.competition_info.guests_free.free")
              )}
            </Stat.ValueText>
          </Stat.Root>

          {showWaitingList ? (
            <Stat.Root variant="competition">
              <Stat.Label>
                <CompetitorsIcon />
                {t("competitions.competition_info.waiting_list_size")}
              </Stat.Label>
              <Stat.ValueText>
                <FormatNumber value={competitionInfo.waiting_list_count} />
              </Stat.ValueText>
            </Stat.Root>
          ) : (
            <Stat.Root variant="competition">
              <Stat.Label>
                <OnTheSpotRegistrationIcon />
                {t(
                  "competitions.competition_form.labels.registration.allow_on_the_spot",
                )}
              </Stat.Label>
              <Stat.ValueText>
                {competitionInfo.on_the_spot_registration
                  ? t("simple_form.yes")
                  : t("simple_form.no")}
              </Stat.ValueText>
            </Stat.Root>
          )}

          <Stat.Root variant="competition">
            <Stat.Label>
              <CompRegoOpenDateIcon />
              {t(
                "competitions.competition_form.labels.registration.opening_date_time",
              )}
            </Stat.Label>
            <Stat.ValueText>
              <LocalDateTime isoDateTime={competitionInfo.registration_open} />
            </Stat.ValueText>
          </Stat.Root>

          <Stat.Root variant="competition">
            <Stat.Label>
              <CompRegoCloseDateIcon />
              {t(
                "competitions.competition_form.labels.registration.closing_date_time",
              )}
            </Stat.Label>
            <Stat.ValueText>
              <LocalDateTime isoDateTime={competitionInfo.registration_close} />
            </Stat.ValueText>
          </Stat.Root>
        </SimpleGrid>
      </Card.Body>
    </Card.Root>
  );
}

export function EventCard({
  competitionInfo,
}: {
  competitionInfo: components["schemas"]["CompetitionInfo"];
}) {
  return (
    <Card.Root>
      <Card.Body>
        <Card.Title textStyle="s4">Events List</Card.Title>
        <Wrap gap="4">
          {competitionInfo.event_ids.map((event_id) => (
            <LabelledEventIcon
              key={event_id}
              eventId={event_id}
              boxSize="8"
              color={
                event_id === competitionInfo.main_event_id && event_id !== "333"
                  ? "green.solid"
                  : "currentColor"
              }
            />
          ))}
        </Wrap>
      </Card.Body>
    </Card.Root>
  );
}

export function InfoCard({
  competitionInfo,
  bookmark,
  userId,
  t,
}: {
  competitionInfo: components["schemas"]["CompetitionInfo"];
  bookmark?: components["schemas"]["CompetitionBookmark"];
  userId?: number;
  t: TFunction;
}) {
  const isCompetitionStaff =
    competitionInfo.organizers.some((organizer) => organizer.id === userId) ||
    competitionInfo.delegates.some((delegate) => delegate.id === userId);

  return (
    <Card.Root>
      <Card.Body>
        <Heading textStyle="h2" display="flex" alignItems="center">
          {competitionInfo.name}
          {bookmark && (
            <BookmarkButton
              competitionId={competitionInfo.id}
              initialBookmark={bookmark}
            />
          )}
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
          <Stat.Root variant="competition">
            <Stat.Label>
              <CompRegoOpenDateIcon />
              Date
            </Stat.Label>
            <Stat.ValueText>
              {formatDateRange(
                new Date(competitionInfo.start_date),
                new Date(competitionInfo.end_date),
              )}
            </Stat.ValueText>
          </Stat.Root>

          <Stat.Root variant="competition">
            <Stat.Label>
              <LocationIcon />
              {t("competitions.competition_info.location")}
            </Stat.Label>
            {/* City and country overflowed a narrow card on one line; wrapping drops the
                country onto its own row exactly when it no longer fits. */}
            <Stat.ValueText flexWrap="wrap">
              <Text>{competitionInfo.city}, </Text>
              <CountryMap
                code={competitionInfo.country_iso2}
                t={t}
                fontWeight="bold"
              />
            </Stat.ValueText>
          </Stat.Root>

          <Stat.Root variant="competition">
            <Stat.Label>
              <VenueIcon />
              {t("competitions.competition_info.venue")}
            </Stat.Label>
            <ChakraMarkdown paragraphAs={Stat.ValueText}>
              {competitionInfo.venue}
            </ChakraMarkdown>
          </Stat.Root>

          <Stat.Root variant="competition">
            <Stat.Label>
              <MapIcon />
              {t("competitions.competition_info.address")}
            </Stat.Label>
            <Stat.ValueText>{competitionInfo.venue_address}</Stat.ValueText>
          </Stat.Root>

          {competitionInfo.venue_details && (
            <Stat.Root variant="competition">
              <Stat.Label>
                <DetailsIcon />
                {t("competitions.competition_info.details")}
              </Stat.Label>
              <ChakraMarkdown paragraphAs={Stat.ValueText}>
                {competitionInfo.venue_details}
              </ChakraMarkdown>
            </Stat.Root>
          )}

          {isCompetitionStaff && (
            <Stat.Root variant="competition">
              <Stat.Label>
                <BookmarkIcon />
                {t("competitions.competition_info.number_of_bookmarks")}
              </Stat.Label>
              <Stat.ValueText>
                <FormatNumber value={competitionInfo.number_of_bookmarks} />
              </Stat.ValueText>
            </Stat.Root>
          )}
        </SimpleGrid>
      </Card.Body>
    </Card.Root>
  );
}

export function SubPageCard({
  competitionInfo,
  t,
}: {
  competitionInfo: components["schemas"]["CompetitionInfo"];
  t: TFunction;
}) {
  return (
    <Card.Root>
      <Card.Body>
        <Card.Title asChild>
          <Heading textStyle="h2" display="flex" alignItems="center">
            {competitionInfo.name}
          </Heading>
        </Card.Title>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
          <Stat.Root variant="competition">
            <Stat.Label>
              <CompRegoOpenDateIcon />
              Date
            </Stat.Label>
            <Stat.ValueText>
              {formatDateRange(
                new Date(competitionInfo.start_date),
                new Date(competitionInfo.end_date),
              )}
            </Stat.ValueText>
          </Stat.Root>

          <Stat.Root variant="competition">
            <Stat.Label>
              <LocationIcon />
              {t("competitions.competition_info.location")}
            </Stat.Label>
            {/* City and country overflowed a narrow card on one line; wrapping drops the
                country onto its own row exactly when it no longer fits. */}
            <Stat.ValueText flexWrap="wrap">
              <Text>{competitionInfo.city}, </Text>
              <CountryMap
                code={competitionInfo.country_iso2}
                t={t}
                fontWeight="bold"
              />
            </Stat.ValueText>
          </Stat.Root>
        </SimpleGrid>
      </Card.Body>
    </Card.Root>
  );
}
