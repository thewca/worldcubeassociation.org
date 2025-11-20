import {
  Button,
  Card,
  FormatNumber,
  Heading,
  SimpleGrid,
  Text,
  Link as ChakraLink,
  HStack,
  Stat,
  Badge,
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
    <Card.Root coloredBg>
      <Card.Body>
        <Card.Title textStyle="s4">Venue Details</Card.Title>
        <SimpleGrid columns={2} gap="4">
          <Stat.Root variant="competition">
            <Stat.Label>
              <VenueIcon />
              Venue
            </Stat.Label>
            <MarkdownProse
              as={Stat.ValueText}
              content={competitionInfo.venue}
            />
          </Stat.Root>

          <Stat.Root variant="competition">
            <Stat.Label>
              <MapIcon />
              Address
            </Stat.Label>
            <Stat.ValueText>{competitionInfo.venue_address}</Stat.ValueText>
          </Stat.Root>

          <Stat.Root variant="competition">
            <Stat.Label>
              <DetailsIcon />
              Details
            </Stat.Label>
            <MarkdownProse
              as={Stat.ValueText}
              content={competitionInfo.venue_details}
            />
          </Stat.Root>
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
    <Card.Root coloredBg>
      <Card.Body>
        <Card.Title textStyle="s4">Information</Card.Title>
        <MarkdownProse
          as={Card.Description}
          content={competitionInfo.information}
          textStyle="body"
        />
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
    <Card.Root coloredBg>
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
    <Card.Root coloredBg>
      <Card.Body>
        <Card.Title textStyle="s4">Registration</Card.Title>
        <SimpleGrid columns={2} gap="4">
          <Stat.Root variant="competition">
            <Stat.Label>
              <PaymentIcon />
              Base Registration Fee
            </Stat.Label>
            <HStack>
              <Stat.ValueText>
                <FormatNumber
                  value={
                    competitionInfo.base_entry_fee_lowest_denomination / 100
                  }
                  style="currency"
                  currency={competitionInfo.currency_code}
                />
              </Stat.ValueText>
              <Badge>{competitionInfo.currency_code}</Badge>
            </HStack>
          </Stat.Root>

          <Stat.Root variant="competition">
            <Stat.Label>
              <SpotsLeftIcon />
              Number of Registrations
            </Stat.Label>
            <Stat.ValueText>
              <FormatNumber value={0} />/
              <FormatNumber value={competitionInfo.competitor_limit} />
            </Stat.ValueText>
          </Stat.Root>

          <Stat.Root variant="competition">
            <Stat.Label>
              <SpectatorsIcon />
              Spectators
            </Stat.Label>
            <Stat.ValueText>
              {competitionInfo.guests_entry_fee_lowest_denomination === 0 ? (
                "Free"
              ) : (
                <HStack>
                  <FormatNumber
                    value={
                      competitionInfo.guests_entry_fee_lowest_denomination / 100
                    }
                    style="currency"
                    currency={competitionInfo.currency_code}
                  />
                  <Badge>{competitionInfo.currency_code}</Badge>
                </HStack>
              )}
            </Stat.ValueText>
          </Stat.Root>

          <Stat.Root variant="competition">
            <Stat.Label>
              <OnTheSpotRegistrationIcon />
              On the spot Registration
            </Stat.Label>
            <Stat.ValueText>
              {competitionInfo.on_the_spot_registration ? "Yes" : "No"}
            </Stat.ValueText>
          </Stat.Root>

          <Stat.Root variant="competition">
            <Stat.Label>
              <CompRegoOpenDateIcon />
              Registration Opens
            </Stat.Label>
            <Stat.ValueText>{formattedRegoOpenDate}</Stat.ValueText>
          </Stat.Root>

          <Stat.Root variant="competition">
            <Stat.Label>
              <CompRegoCloseDateIcon />
              Registration Closes
            </Stat.Label>
            <Stat.ValueText>{formattedRegoClosedDate}</Stat.ValueText>
          </Stat.Root>

          <Stat.Root variant="competition">
            <Stat.Label>
              <PaymentIcon />
              Payment
            </Stat.Label>
            <Stat.ValueText>API Needed</Stat.ValueText>
          </Stat.Root>
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
    <Card.Root flexGrow="1" coloredBg>
      <Card.Body>
        <Card.Title textStyle="s4">Organization Team</Card.Title>
        <Stat.Root variant="competition">
          <Stat.Label>Organizers</Stat.Label>
          <Stat.ValueText>
            {competitionInfo.organizers.map((organizer, index) => (
              <Text as="span" key={index}>
                {organizer.url != "" ? (
                  <ChakraLink href={organizer.url}>{organizer.name}</ChakraLink>
                ) : (
                  organizer.name
                )}
                {competitionInfo.organizers.length == index + 1 ? "" : ", "}
              </Text>
            ))}
          </Stat.ValueText>
        </Stat.Root>

        <Stat.Root variant="competition">
          <Stat.Label>Delegates</Stat.Label>
          <Stat.ValueText>
            {competitionInfo.delegates.map((delegate, index) => (
              <Text as="span" key={index}>
                <ChakraLink href={delegate.url}>{delegate.name}</ChakraLink>
                {competitionInfo.delegates.length == index + 1 ? "" : ", "}
              </Text>
            ))}
          </Stat.ValueText>
        </Stat.Root>

        <Stat.Root variant="competition">
          <Stat.Label>Contact</Stat.Label>
          <MarkdownProse
            as={Stat.ValueText}
            content={competitionInfo.contact}
          />
        </Stat.Root>

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
    <Card.Root coloredBg>
      <Card.Body>
        <Card.Title textStyle="s4">Events List</Card.Title>
        <HStack gap="4">
          {competitionInfo.event_ids.map((event_id) => (
            <EventIcon
              key={event_id}
              eventId={event_id}
              boxSize="8"
              color={
                event_id === competitionInfo.main_event_id && event_id !== "333"
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
    <Card.Root coloredBg>
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
