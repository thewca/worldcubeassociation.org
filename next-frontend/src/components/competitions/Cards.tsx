import {
  Button,
  Card,
  FormatNumber,
  Heading,
  SimpleGrid,
  Text,
  Link as ChakraLink,
  HStack,
} from "@chakra-ui/react";
import BookmarkIcon from "@/components/icons/BookmarkIcon";
import CompRegoOpenDateIcon from "@/components/icons/CompRegoOpenDateIcon";
import LocationIcon from "@/components/icons/LocationIcon";
import CountryMap from "@/components/CountryMap";
import CompetitorsIcon from "@/components/icons/CompetitorsIcon";
import { components } from "@/types/openapi";
import { TFunction } from "i18next";
import PaymentIcon from "@/components/icons/PaymentIcon";
import SpotsLeftIcon from "@/components/icons/SpotsLeftIcon";
import SpectatorsIcon from "@/components/icons/SpectatorsIcon";
import OnTheSpotRegistrationIcon from "@/components/icons/OnTheSpotRegistrationIcon";
import CompRegoCloseDateIcon from "@/components/icons/CompRegoCloseDateIcon";
import EventIcon from "@/components/EventIcon";
import { MarkdownProse } from "@/components/Markdown";
import WcaDocsIcon from "@/components/icons/WcaDocsIcon";
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
    <Card.Root variant="plain" colorPalette="white">
      <Card.Body bg="colorPalette.textBox.bg" borderRadius="wca">
        <Card.Title textStyle="s4">
          Venue Details
        </Card.Title>
        <SimpleGrid columns={2} gap="4">
          <Card.Root variant="infoSnippet">
            <Card.Header>
              <VenueIcon />
              Venue
            </Card.Header>
            <MarkdownProse as={Card.Body} content={competitionInfo.venue} textStyle="bodyEmphasis" color="colorPalette.contrast" />
          </Card.Root>

          <Card.Root variant="infoSnippet">
            <Card.Header>
              <MapIcon />
              Address
            </Card.Header>
            <Card.Body>
              <Text>{competitionInfo.venue_address}</Text>
            </Card.Body>
          </Card.Root>

          <Card.Root variant="infoSnippet">
            <Card.Header>
              <DetailsIcon />
              Details
            </Card.Header>
            <MarkdownProse as={Card.Body} content={competitionInfo.venue_details} textStyle="bodyEmphasis" color="colorPalette.contrast" />
          </Card.Root>
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
    <Card.Root variant="plain" colorPalette="white" mt="6">
      <Card.Body bg="colorPalette.textBox.bg" borderRadius="wca">
        <Card.Title textStyle="s4">
          Information
        </Card.Title>
        <MarkdownProse as={Card.Body} content={competitionInfo.information} textStyle="body" color="colorPalette.contrast" />
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
    <Card.Root variant="plain" colorPalette="white">
      <Card.Body bg="colorPalette.textBox.bg" borderRadius="wca">
        <Card.Title textStyle="s4">
          Refund Policy
        </Card.Title>
        <Text>
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
        </Text>
      </Card.Body>
    </Card.Root>
  );
}

export function RegistrationCard({
  competitionInfo,
}: {
  competitionInfo: components["schemas"]["CompetitionInfo"];
}) {
  const regoOpenDate = new Date(competitionInfo.registration_open);
  const regoClosedDate = new Date(competitionInfo.registration_close);

  const formattedRegoOpenDate = regoOpenDate.toLocaleString(
    "en-US",
    dateFormat,
  );
  const formattedRegoClosedDate = regoClosedDate.toLocaleString(
    "en-US",
    dateFormat,
  );

  return (
    <Card.Root variant="plain" colorPalette="white">
      <Card.Body bg="colorPalette.textBox.bg" borderRadius="wca">
        <Card.Title textStyle="s4">
          Registration
        </Card.Title>
        <SimpleGrid columns={2} gap="4">
          <Card.Root variant="infoSnippet">
            <Card.Header>
              <PaymentIcon />
              Base Registration Fee
            </Card.Header>
            <Card.Body>
              <FormatNumber
                value={competitionInfo.base_entry_fee_lowest_denomination / 100}
                style="currency"
                currency={competitionInfo.currency_code}
              />{" "}
              {competitionInfo.currency_code}
            </Card.Body>
          </Card.Root>

          <Card.Root variant="infoSnippet">
            <Card.Header>
              <SpotsLeftIcon />
              Number of Registrations
            </Card.Header>
            <Card.Body>
              <FormatNumber value={0} />/
              <FormatNumber value={competitionInfo.competitor_limit} />
            </Card.Body>
          </Card.Root>

          <Card.Root variant="infoSnippet">
            <Card.Header>
              <SpectatorsIcon />
              Spectators
            </Card.Header>
            <Card.Body>
              {competitionInfo.guests_entry_fee_lowest_denomination === 0 ? (
                "Free"
              ) : (
                <>
                  <FormatNumber
                    value={
                      competitionInfo.guests_entry_fee_lowest_denomination / 100
                    }
                    style="currency"
                    currency={competitionInfo.currency_code}
                  />{" "}
                  {competitionInfo.currency_code}
                </>
              )}
            </Card.Body>
          </Card.Root>

          <Card.Root variant="infoSnippet">
            <Card.Header>
              <OnTheSpotRegistrationIcon />
              On the spot Registration
            </Card.Header>
            <Card.Body>
              <Text>
                {competitionInfo.on_the_spot_registration ? "Yes" : "No"}
              </Text>
            </Card.Body>
          </Card.Root>

          <Card.Root variant="infoSnippet">
            <Card.Header>
              <CompRegoOpenDateIcon />
              Registration Opens
            </Card.Header>
            <Card.Body>
              <Text>{formattedRegoOpenDate}</Text>
            </Card.Body>
          </Card.Root>

          <Card.Root variant="infoSnippet">
            <Card.Header>
              <CompRegoCloseDateIcon />
              Registration Closes
            </Card.Header>
            <Card.Body>
              <Text>{formattedRegoClosedDate}</Text>
            </Card.Body>
          </Card.Root>

          <Card.Root variant="infoSnippet">
            <Card.Header>
              <PaymentIcon />
              Payment
            </Card.Header>
            <Card.Body>API Needed</Card.Body>
          </Card.Root>
        </SimpleGrid>
      </Card.Body>
    </Card.Root>
  );
}

export function OrganizationTeamCard({
  competitionInfo,
}: {
  competitionInfo: components["schemas"]["CompetitionInfo"];
}) {
  return (
    <Card.Root variant="plain" colorPalette="white">
      <Card.Body bg="colorPalette.textBox.bg" borderRadius="wca">
        <Card.Title textStyle="s4">
          Organization Team
        </Card.Title>
        <Card.Root variant="infoSnippet">
          <Card.Header>Organizers</Card.Header>
          <Card.Body>
            <Text>
              {competitionInfo.organizers.map((organizer, index) => (
                <Text as="span" key={index}>
                  {organizer.url != "" ? (
                    <ChakraLink href={organizer.url}>
                      {organizer.name}
                    </ChakraLink>
                  ) : (
                    organizer.name
                  )}
                  {competitionInfo.organizers.length == index + 1 ? "" : ", "}
                </Text>
              ))}
            </Text>
          </Card.Body>
        </Card.Root>

        <Card.Root variant="infoSnippet">
          <Card.Header>Delegates</Card.Header>
          <Card.Body>
            <Text>
              {competitionInfo.delegates.map((delegate, index) => (
                <Text as="span" key={index}>
                  <ChakraLink href={delegate.url}>{delegate.name}</ChakraLink>
                  {competitionInfo.delegates.length == index + 1 ? "" : ", "}
                </Text>
              ))}
            </Text>
          </Card.Body>
        </Card.Root>

        <Card.Root variant="infoSnippet">
          <Card.Header>Contact</Card.Header>
          <MarkdownProse as={Card.Body} textStyle="bodyEmphasis" content={competitionInfo.contact} color="colorPalette.contrast" />
        </Card.Root>
        <Button variant="outline" asChild>
          <ChakraLink
            variant="header"
            href={
              "https://www.worldcubeassociation.org/competitions/" +
              competitionInfo.id +
              ".pdf"
            }
          >
            Download Competition PDF
            <WcaDocsIcon />
          </ChakraLink>
        </Button>
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
    <Card.Root variant="plain" colorPalette="white">
      <Card.Body bg="colorPalette.textBox.bg" borderRadius="wca">
        <Card.Title textStyle="s4">
          Events List
        </Card.Title>
        <HStack gap="4">
          {competitionInfo.event_ids.map((event_id) => (
            <EventIcon
              key={event_id}
              eventId={event_id}
              boxSize="8"
              color={
                (event_id === competitionInfo.main_event_id && event_id !== "333")
                  ? "green.1A"
                  : "currentColor"
              }
            />
          ))}
        </HStack>
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
    <Card.Root variant="plain" colorPalette="white">
      <Card.Body bg="colorPalette.textBox.bg" borderRadius="wca">
        <Heading textStyle="h2" display="flex" alignItems="center">
          {competitionInfo.name}
          <Button variant="ghost">
            <BookmarkIcon boxSize="6" />
          </Button>
        </Heading>

        <SimpleGrid columns={2} gap="4">
          <Card.Root variant="infoSnippet">
            <Card.Header>
              <CompRegoOpenDateIcon />
              Date
            </Card.Header>
            <Card.Body>
              <Text>
                {formatDateRange(
                  new Date(competitionInfo.start_date),
                  new Date(competitionInfo.end_date),
                )}
              </Text>
            </Card.Body>
          </Card.Root>

          <Card.Root variant="infoSnippet">
            <Card.Header>
              <LocationIcon />
              {t("competitions.competition_info.location")}
            </Card.Header>
            <Card.Body>
              <Text>{competitionInfo.city}, </Text>
              <CountryMap
                code={competitionInfo.country_iso2}
                t={t}
                fontWeight="bold"
              />
            </Card.Body>
          </Card.Root>

          <Card.Root variant="infoSnippet">
            <Card.Header>
              <CompetitorsIcon />
              Competitor Limit
            </Card.Header>
            <Card.Body>
              <FormatNumber value={competitionInfo.competitor_limit} />
            </Card.Body>
          </Card.Root>

          <Card.Root variant="infoSnippet">
            <Card.Header>
              <BookmarkIcon />
              Bookmarked
            </Card.Header>
            <Card.Body>
              <FormatNumber value={competitionInfo.number_of_bookmarks} /> Times
            </Card.Body>
          </Card.Root>
        </SimpleGrid>
      </Card.Body>
    </Card.Root>
  );
}
