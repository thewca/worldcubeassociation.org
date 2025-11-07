import {components} from "@/types/openapi";
import {Badge, Card, FormatNumber, HStack, SimpleGrid, Stat} from "@chakra-ui/react";
import PaymentIcon from "@/components/icons/PaymentIcon";
import SpotsLeftIcon from "@/components/icons/SpotsLeftIcon";
import SpectatorsIcon from "@/components/icons/SpectatorsIcon";
import OnTheSpotRegistrationIcon from "@/components/icons/OnTheSpotRegistrationIcon";
import CompRegoOpenDateIcon from "@/components/icons/CompRegoOpenDateIcon";
import CompRegoCloseDateIcon from "@/components/icons/CompRegoCloseDateIcon";

const dateFormat: Intl.DateTimeFormatOptions = {
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
  timeZoneName: "short",
};

export default function RegistrationRequirementsCard({
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

  // missing:
  // - competition series
  // - refund deadline
  // - waiting list deadline
  // - event change deadline
  // - guests restricted as competitor companions?
  // - maximum number of guests
  // - only for qualified?
  // - maximum number of events per competitor
  return (
    <Card.Root coloredBg>
      <Card.Body>
        <Card.Title textStyle="s4">Registration</Card.Title>
        <SimpleGrid columns={3} gap="4">
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
