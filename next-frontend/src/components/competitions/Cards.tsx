import {
  Button,
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
import { DateTime } from "luxon";
import CurrencyValue from "@/components/CurrencyValue";
import PaymentIcon from "@/components/icons/PaymentIcon";
import SpotsLeftIcon from "@/components/icons/SpotsLeftIcon";
import SpectatorsIcon from "@/components/icons/SpectatorsIcon";
import OnTheSpotRegistrationIcon from "@/components/icons/OnTheSpotRegistrationIcon";
import CompRegoCloseDateIcon from "@/components/icons/CompRegoCloseDateIcon";
import EventIcon from "@/components/EventIcon";
import { ChakraMarkdown } from "@/components/Markdown";
import VenueIcon from "@/components/icons/VenueIcon";
import MapIcon from "@/components/icons/MapIcon";
import DetailsIcon from "@/components/icons/DetailsIcon";

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

const dateFormat = {
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
  timeZoneName: "short",
} as Intl.DateTimeFormatOptions;

export function VenueDetailsCard({
  competitionInfo,
}: {
  competitionInfo: components["schemas"]["CompetitionInfo"];
}) {
  return (
    <Card.Root width="inherit">
      <Card.Body>
        <Card.Title textStyle="s4">Venue Details</Card.Title>
        <SimpleGrid columns={2} gap="4">
          <Stat.Root variant="competition">
            <Stat.Label>
              <VenueIcon />
              Venue
            </Stat.Label>
            <ChakraMarkdown paragraphAs={Stat.ValueText}>
              {competitionInfo.venue}
            </ChakraMarkdown>
          </Stat.Root>

          <Stat.Root variant="competition">
            <Stat.Label>
              <MapIcon />
              Address
            </Stat.Label>
            <Stat.ValueText>{competitionInfo.venue_address}</Stat.ValueText>
          </Stat.Root>

          {competitionInfo.venue_details && (
            <Stat.Root variant="competition">
              <Stat.Label>
                <DetailsIcon />
                Details
              </Stat.Label>
              <ChakraMarkdown paragraphAs={Stat.ValueText}>
                {competitionInfo.venue_details}
              </ChakraMarkdown>
            </Stat.Root>
          )}
        </SimpleGrid>
      </Card.Body>
    </Card.Root>
  );
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
          imageProps={{ maxW: "sm" }}
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
  const refundDate = new Date(competitionInfo.refund_policy_limit_date);
  const formattedRefundDate = refundDate.toLocaleString("en-US", dateFormat);

  return (
    <Card.Root>
      <Card.Body>
        <Card.Title textStyle="s4">Refund Policy</Card.Title>
        <Card.Description>
          If your registration is cancelled before {formattedRefundDate} you
          will be refunded
          <Text as="span" fontWeight="bold">
            {" "}
            <FormatNumber
              value={competitionInfo.refund_policy_percent / 100}
              style="percent"
            />{" "}
          </Text>
          of your registration fee.
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

  const formatDateTime = (isoDateTime: string) =>
    DateTime.fromISO(isoDateTime).toLocaleString(DateTime.DATETIME_FULL);

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
              {t("competitions.competition_info.competitor_limit")}
            </Stat.Label>
            <Stat.ValueText>
              {competitionInfo.spots_left == null ? (
                t("competitions.competition_info.no_competitor_limit")
              ) : (
                <>
                  <FormatNumber value={competitionInfo.spots_left} />/
                  <FormatNumber value={competitionInfo.competitor_limit} />
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
              {/* A free guest entry formats as a zero amount rather than the word "free",
                  which has no translation of its own. */}
              <CurrencyValue
                lowestDenomination={
                  competitionInfo.guests_entry_fee_lowest_denomination
                }
                currencyCode={competitionInfo.currency_code}
              />
            </Stat.ValueText>
          </Stat.Root>

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

          <Stat.Root variant="competition">
            <Stat.Label>
              <CompRegoOpenDateIcon />
              {t(
                "competitions.competition_form.labels.registration.opening_date_time",
              )}
            </Stat.Label>
            <Stat.ValueText>
              {formatDateTime(competitionInfo.registration_open)}
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
              {formatDateTime(competitionInfo.registration_close)}
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
            <EventIcon
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
  t,
}: {
  competitionInfo: components["schemas"]["CompetitionInfo"];
  t: TFunction;
}) {
  return (
    <Card.Root>
      <Card.Body>
        <Heading textStyle="h2" display="flex" alignItems="center">
          {competitionInfo.name}
          <Button variant="ghost">
            <BookmarkIcon boxSize="6" />
          </Button>
        </Heading>

        <SimpleGrid columns={2} gap="4">
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
            <Stat.ValueText>
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
              <CompetitorsIcon />
              Competitor Limit
            </Stat.Label>
            <Stat.ValueText>
              <FormatNumber value={competitionInfo.competitor_limit} />
            </Stat.ValueText>
          </Stat.Root>

          <Stat.Root variant="competition">
            <Stat.Label>
              <BookmarkIcon />
              Bookmarked
            </Stat.Label>
            <Stat.ValueText>
              <FormatNumber value={competitionInfo.number_of_bookmarks} /> Times
            </Stat.ValueText>
          </Stat.Root>
        </SimpleGrid>
      </Card.Body>
    </Card.Root>
  );
}
