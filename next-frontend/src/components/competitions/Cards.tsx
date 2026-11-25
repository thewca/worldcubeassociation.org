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

export async function VenueDetailsCard({
  competitionInfo,
}: {
  competitionInfo: components["schemas"]["V1CompetitionInfo"];
}) {
  const { t } = await getT();

  return (
    <Card.Root width="inherit">
      <Card.Body>
        <Card.Title textStyle="s4">
          {t("competitions.competition_form.labels.venue.details")}
        </Card.Title>
        {/* Sized against the card rather than the viewport: the card is narrow on a phone,
            but also in a narrow desktop column, and both want one column. A flex basis
            (unlike SimpleGrid's `minmax()` minimum) can still shrink below 3xs. */}
        <Wrap gap="4">
          <Stat.Root variant="competition" flexBasis="3xs" flexGrow="1">
            <Stat.Label>
              <VenueIcon />
              {t("competitions.competition_info.venue")}
            </Stat.Label>
            <ChakraMarkdown paragraphAs={Stat.ValueText}>
              {competitionInfo.location.name}
            </ChakraMarkdown>
          </Stat.Root>

          <Stat.Root variant="competition" flexBasis="3xs" flexGrow="1">
            <Stat.Label>
              <MapIcon />
              {t("competitions.competition_info.address")}
            </Stat.Label>
            <Stat.ValueText>{competitionInfo.location.address}</Stat.ValueText>
          </Stat.Root>

          {competitionInfo.location.details && (
            <Stat.Root variant="competition" flexBasis="3xs" flexGrow="1">
              <Stat.Label>
                <DetailsIcon />
                {t("competitions.competition_info.details")}
              </Stat.Label>
              <ChakraMarkdown paragraphAs={Stat.ValueText}>
                {competitionInfo.location.details}
              </ChakraMarkdown>
            </Stat.Root>
          )}
        </Wrap>
      </Card.Body>
    </Card.Root>
  );
}

export async function AdditionalInformationCard({
  competitionInfo,
}: {
  competitionInfo: components["schemas"]["V1CompetitionInfo"];
}) {
  const { t } = await getT();

  return (
    <Card.Root>
      <Card.Body>
        <Card.Title textStyle="s4">
          {t("competitions.competition_info.information")}
        </Card.Title>
        <ChakraMarkdown
          paragraphAs={Card.Description}
          imageProps={{ maxW: { base: "full", md: "sm" } }}
          listProps={{ textStyle: "body" }}
          textStyle="body"
          linkProps={{ fontSize: "inherit" }}
        >
          {competitionInfo.information}
        </ChakraMarkdown>
      </Card.Body>
    </Card.Root>
  );
}

export async function RefundPolicyCard({
  competitionInfo,
}: {
  competitionInfo: components["schemas"]["V1CompetitionInfo"];
}) {
  const { t } = await getT();

  return (
    <Card.Root>
      <Card.Body>
        <Card.Title textStyle="s4">
          {t("competitions.competition_info.refund_policy")}
        </Card.Title>
        <Card.Description>
          <RefundPolicyText
            refundPolicyPercent={
              competitionInfo.registration_info.refund_policy.percent
            }
            refundPolicyLimitDate={
              competitionInfo.registration_info.refund_policy.limit_date
            }
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
  competitionInfo: components["schemas"]["V1CompetitionInfo"];
  columns?: number;
}) {
  const { t } = await getT();

  const registrationInfo = competitionInfo.registration_info;
  const competitorLimit = registrationInfo.competitor_limit;

  const registrationNotYetOpen = hasNotPassed(registrationInfo.opens_at);
  const registrationClosed = hasPassed(registrationInfo.closes_at);
  const spotsLeft = registrationInfo.spots_left;
  const hasNoCompetitorLimit = spotsLeft === null || competitorLimit === null;
  const showWaitingList =
    spotsLeft !== null &&
    spotsLeft <= 0 &&
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
                  registrationInfo.fees.base_entry_lowest_denomination
                }
                currencyCode={registrationInfo.fees.currency_code}
              />
            </Stat.ValueText>
          </Stat.Root>

          <Stat.Root variant="competition">
            <Stat.Label>
              <SpotsLeftIcon />
              {hasNoCompetitorLimit || registrationNotYetOpen
                ? t("competitions.competition_info.competitor_limit")
                : registrationClosed
                  ? t("competitions.nav.menu.competitors")
                  : t("competitions.my_competitions_table.registrations")}
            </Stat.Label>
            <Stat.ValueText>
              {hasNoCompetitorLimit ? (
                t("competitions.competition_info.no_competitor_limit")
              ) : registrationNotYetOpen ? (
                <FormatNumber value={competitorLimit} />
              ) : (
                <>
                  <FormatNumber
                    value={competitorLimit - Math.max(spotsLeft, 0)}
                  />
                  {!registrationClosed && (
                    <>
                      {/* Escape character for "/" */}
                      <span>&#47;</span>
                      <FormatNumber value={competitorLimit} />
                    </>
                  )}
                </>
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
              {registrationInfo.fees.guests_entry_lowest_denomination ? (
                <CurrencyValue
                  lowestDenomination={
                    registrationInfo.fees.guests_entry_lowest_denomination
                  }
                  currencyCode={registrationInfo.fees.currency_code}
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
                <FormatNumber value={registrationInfo.waiting_list_count} />
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
                {registrationInfo.on_the_spot_registration
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
              {registrationInfo.opens_at && (
                <LocalDateTime isoDateTime={registrationInfo.opens_at} />
              )}
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
              {registrationInfo.closes_at && (
                <LocalDateTime isoDateTime={registrationInfo.closes_at} />
              )}
            </Stat.ValueText>
          </Stat.Root>
        </SimpleGrid>
      </Card.Body>
    </Card.Root>
  );
}

export async function EventCard({
  competitionInfo,
}: {
  competitionInfo: components["schemas"]["V1CompetitionInfo"];
}) {
  const { t } = await getT();

  return (
    <Card.Root>
      <Card.Body>
        <Card.Title textStyle="s4">
          {t("competitions.competition_info.events")}
        </Card.Title>
        <Wrap gap="4">
          {competitionInfo.events.event_ids.map((event_id) => (
            <LabelledEventIcon
              key={event_id}
              eventId={event_id}
              boxSize="8"
              color={
                event_id === competitionInfo.events.main_event_id &&
                event_id !== "333"
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
  t,
}: {
  competitionInfo: components["schemas"]["V1CompetitionInfo"];
  bookmark?: components["schemas"]["CompetitionBookmark"];
  t: TFunction;
}) {
  return (
    <Card.Root>
      <Card.Body>
        <Heading textStyle="h2" display="flex" alignItems="center" asChild>
          <Text as="span" minW={0} overflowWrap="anywhere">
            {competitionInfo.name}
          </Text>
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
              {t("competitions.competition_info.date")}
            </Stat.Label>
            <Stat.ValueText>
              {competitionInfo.start_date &&
                competitionInfo.end_date &&
                formatDateRange(
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
              <Text>{competitionInfo.location.city}, </Text>
              <CountryMap
                code={competitionInfo.location.country_iso2}
                t={t}
                fontWeight="bold"
              />
            </Stat.ValueText>
          </Stat.Root>

          <Stat.Root variant="competition">
            <Stat.Label>
              <CompetitorsIcon />
              {t("competitions.competition_info.competitor_limit")}
            </Stat.Label>
            <Stat.ValueText>
              {competitionInfo.registration_info.competitor_limit === null ? (
                t("competitions.competition_info.no_competitor_limit")
              ) : (
                <FormatNumber
                  value={competitionInfo.registration_info.competitor_limit}
                />
              )}
            </Stat.ValueText>
          </Stat.Root>

          <Stat.Root variant="competition">
            <Stat.Label>
              <BookmarkIcon />
              {t("competitions.competition_info.number_of_bookmarks")}
            </Stat.Label>
            <Stat.ValueText>
              <FormatNumber value={competitionInfo.number_of_bookmarks} />
            </Stat.ValueText>
          </Stat.Root>
        </SimpleGrid>
      </Card.Body>
    </Card.Root>
  );
}
