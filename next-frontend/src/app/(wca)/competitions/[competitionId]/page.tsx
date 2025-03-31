import { Container, Heading, Text, Card, FormatNumber, Link as ChakraLink, Button, SimpleGrid, HStack, VStack, Tabs, Separator } from "@chakra-ui/react";
import Link from "next/link";
import PermissionProvider from "@/providers/PermissionProvider";
import PermissionsTestMessage from "@/components/competitions/permissionsTestMessage";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { MarkdownProse } from "@/components/Markdown";
import { MarkdownFirstImage } from "@/components/MarkdownFirstImage"
import EventIcon from "@/components/EventIcon"


import { LuBadgeDollarSign } from "react-icons/lu";


import LocationIcon from "@/components/icons/LocationIcon"; 
import BookmarkIcon from "@/components/icons/BookmarkIcon";
import WcaDocsIcon from "@/components/icons/WcaDocsIcon";
import PaymentIcon from "@/components/icons/PaymentIcon";
import SpotsLeftIcon from "@/components/icons/SpotsLeftIcon";
import SpectatorsIcon from "@/components/icons/SpectatorsIcon";
import OnTheSpotRegistrationIcon from "@/components/icons/OnTheSpotRegistrationIcon";
import CompRegoOpenDateIcon from "@/components/icons/CompRegoOpenDateIcon";
import CompRegoCloseDateIcon from "@/components/icons/CompRegoCloseDateIcon";
import MapIcon from "@/components/icons/MapIcon";
import VenueIcon from "@/components/icons/VenueIcon";
import DetailsIcon from "@/components/icons/DetailsIcon";
import CompetitorsIcon from "@/components/icons/CompetitorsIcon";

import CountryMap from "@/components/CountryMap"

import TabRegister from "@/components/competitions/TabRegister"
import TabCompetitors from "@/components/competitions/TabCompetitors"
import TabEvents from "@/components/competitions/TabEvents"
import TabSchedule from "@/components/competitions/TabSchedule"

function formatDateRange(start: Date, end: Date): string {
  const sameDay = start.toDateString() === end.toDateString();

  // Formatters
  const dayFormatter = new Intl.DateTimeFormat('en-US', { day: 'numeric' });
  const monthDayFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  const fullFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

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

export default async function CompetitionOverView({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  const { data: competitionInfo, error } =
    await getCompetitionInfo(competitionId);

  if (error) {
    return <Text>Error fetching competition</Text>;
  }

  if (!competitionInfo) {
    return <Text>Competition does not exist</Text>;
  }
  console.log(competitionInfo);

  const refundDate = new Date(competitionInfo.refund_policy_limit_date);
  const regoOpenDate = new Date(competitionInfo.registration_open);
  const regoClosedDate = new Date(competitionInfo.registration_close);

  const dateFormat = {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZoneName: "short",
  };

  const formattedRegoOpenDate = regoOpenDate.toLocaleString("en-US", dateFormat);
  const formattedRegoClosedDate = regoClosedDate.toLocaleString("en-US", dateFormat);
  const formattedRefundDate = refundDate.toLocaleString("en-US", dateFormat);

  

  return (
    <Container minW="80vw" p="8">
      <PermissionProvider>
        <PermissionsTestMessage competitionInfo={competitionInfo} />
      </PermissionProvider>
      <Tabs.Root variant="enclosed" w="100%" defaultValue={"general"} orientation="vertical" lazyMount unmountOnExit>
      <Tabs.List height="fit-content" position="sticky" top="3">
        <Tabs.Trigger value="general">General Info</Tabs.Trigger>
        <Tabs.Trigger value="register">Register</Tabs.Trigger>
        <Tabs.Trigger value="competitors">Competitors</Tabs.Trigger>
        <Tabs.Trigger value="events">Events</Tabs.Trigger>
        <Tabs.Trigger value="schedule">Schedule</Tabs.Trigger>
        <Separator />
        <Tabs.Trigger value="custom-1">Custom 1</Tabs.Trigger>
        <Tabs.Trigger value="custom-2">Custom 2</Tabs.Trigger>
        <Tabs.Trigger value="custom-3">Custom 3</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="general">
      <HStack gap="8" alignItems="stretch">
        <VStack maxW="45%" w="45%" gap="8">
      <Card.Root variant="plain">
        <Card.Body>
          <Heading size="4xl" display="flex" alignItems="center"><Button variant="ghost" p="0"><BookmarkIcon /></Button>{competitionInfo.name}</Heading>
          
          <SimpleGrid columns={2} gap="4">
            <Card.Root variant="infoSnippet">
              <Card.Header>
                <CompRegoOpenDateIcon />
                Date
              </Card.Header>
              <Card.Body>
                <Text>{formatDateRange(new Date(competitionInfo.start_date), new Date(competitionInfo.end_date))}</Text>
              </Card.Body>
            </Card.Root>

            <Card.Root variant="infoSnippet">
              <Card.Header>
                <LocationIcon />
                Location
              </Card.Header>
              <Card.Body>
                <Text>{competitionInfo.city}, </Text><CountryMap code={competitionInfo.country_iso2} bold/>
              </Card.Body>
            </Card.Root>

            <Card.Root variant="infoSnippet">
              <Card.Header>
                <CompetitorsIcon />
                Competitor Limit
              </Card.Header>
              <Card.Body>
                <FormatNumber value={competitionInfo.competitor_limit}/>
              </Card.Body>
            </Card.Root>

            <Card.Root variant="infoSnippet">
              <Card.Header>
                <BookmarkIcon />
                Bookmarked
              </Card.Header>
              <Card.Body>
                <FormatNumber value={competitionInfo.number_of_bookmarks}/> Times
              </Card.Body>
            </Card.Root>
          </SimpleGrid>
        </Card.Body>
      </Card.Root>

      <Card.Root variant="plain">
        <Card.Body>
          <Card.Title><Text fontSize="md" textTransform="uppercase" fontWeight="medium" letterSpacing="wider">Registration</Text></Card.Title>
          <SimpleGrid columns={2} gap="4">
            <Card.Root variant="infoSnippet">
              <Card.Header>
                <PaymentIcon />
                Base Registration Fee
              </Card.Header>
              <Card.Body>
                <FormatNumber value={competitionInfo.base_entry_fee_lowest_denomination/100} style="currency" currency={competitionInfo.currency_code} /> {competitionInfo.currency_code}
              </Card.Body>
            </Card.Root>

            <Card.Root variant="infoSnippet">
              <Card.Header>
                <SpotsLeftIcon />
                Number of Registrations
              </Card.Header>
              <Card.Body>
              <FormatNumber value={0}/>/<FormatNumber value={competitionInfo.competitor_limit}/>
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
                      value={competitionInfo.guests_entry_fee_lowest_denomination / 100}
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
                <Text>{competitionInfo.on_the_spot_registration ? "Yes" : "No"}</Text>
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
              <Card.Body>
                API Needed
              </Card.Body>
            </Card.Root>
          </SimpleGrid>
        </Card.Body>
      </Card.Root>

      <Card.Root variant="plain">
        <Card.Body>
          <Card.Title>
            <Text fontSize="md" textTransform="uppercase" fontWeight="medium" letterSpacing="wider">Events List</Text>
          </Card.Title>
          <Text>
          {competitionInfo.event_ids.map((event_id) => (
            <EventIcon eventId={event_id} main={event_id === competitionInfo.main_event_id} key={event_id}/>
          ))}
          </Text>
        </Card.Body>
      </Card.Root>

      </VStack>
      <VStack maxW="55%" w="55%" gap="8">
        <HStack gap="8" alignItems="stretch" width="100%">
        <Card.Root variant="plain">
          <Card.Body>
            <Card.Title><Text fontSize="md" textTransform="uppercase" fontWeight="medium" letterSpacing="wider">Organisation Team</Text></Card.Title>
            <Card.Root variant="infoSnippet">
              <Card.Header>
                Organisers
              </Card.Header>
              <Card.Body>
                <Text>
                  {competitionInfo.organizers.map((organizer, index) => (
                    <Text as="span">{organizer.url != "" ? <ChakraLink asChild><Link href={organizer.url}>{organizer.name}</Link></ChakraLink> : organizer.name}
                    {competitionInfo.organizers.length == index + 1 ? "" : ", "}</Text>
                  ))}
                </Text>
              </Card.Body>
            </Card.Root>

            <Card.Root variant="infoSnippet">
              <Card.Header>
                Delegates
              </Card.Header>
              <Card.Body>
                <Text>
                  {competitionInfo.delegates.map((delegates, index) => (
                    <Text as="span"><ChakraLink asChild><Link href={delegates.url}>{delegates.name}</Link></ChakraLink>{competitionInfo.delegates.length == index + 1 ? "" : ", "}</Text>
                  ))}
                </Text>
              </Card.Body>
            </Card.Root>

            <Card.Root variant="infoSnippet">
              <Card.Header>
                Contact
              </Card.Header>
              <Card.Body>
              <MarkdownProse content={competitionInfo.contact} />
              </Card.Body>
            </Card.Root>
            <ChakraLink asChild variant="plainLink">
              <Link href={"https://www.worldcubeassociation.org/competitions/" + competitionInfo.id + ".pdf"}>
                <Button variant="outline">Download Competition PDF<WcaDocsIcon /></Button>
              </Link>
            </ChakraLink>
          </Card.Body>
        </Card.Root>
        
        <MarkdownFirstImage content={competitionInfo.information} />



        </HStack>

     

        <Card.Root variant="plain">
          <Card.Body>
            <Card.Title><Text fontSize="md" textTransform="uppercase" fontWeight="medium" letterSpacing="wider">Venue Details</Text></Card.Title>
            <SimpleGrid columns={2} gap="4">
              <Card.Root variant="infoSnippet">
                <Card.Header>
                  <VenueIcon />
                  Venue
                </Card.Header>
                <Card.Body>
                <MarkdownProse content={competitionInfo.venue} />
                </Card.Body>
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
                <Card.Body>
                <MarkdownProse content={competitionInfo.venue_details} />
                </Card.Body>
              </Card.Root>
            </SimpleGrid>
          </Card.Body>
        </Card.Root>

        <Card.Root variant="plain">
          <Card.Body>
            <Card.Title><Text fontSize="md" textTransform="uppercase" fontWeight="medium" letterSpacing="wider">Refund Policy</Text></Card.Title>
            <Text>
              If your registration is cancelled before {formattedRefundDate} you will be refunded
              <Text as="span" fontWeight="bold"> <FormatNumber value={competitionInfo.refund_policy_percent/100} style="percent"/> </Text>
              of your registration fee.
            </Text>
          </Card.Body>
        </Card.Root>
      
      </VStack>
      </HStack>

      <Card.Root variant="plain" mt="8">
        <Card.Body>
          <Card.Title><Text fontSize="md" textTransform="uppercase" fontWeight="medium" letterSpacing="wider">Information</Text></Card.Title>
          <MarkdownProse content={competitionInfo.information} />
        </Card.Body>
      </Card.Root>
      </Tabs.Content>
      <Tabs.Content value="register"><TabRegister /></Tabs.Content>
      <Tabs.Content value="competitors"><TabCompetitors id={competitionInfo.id}/></Tabs.Content>
      <Tabs.Content value="events"><TabEvents /></Tabs.Content>
      <Tabs.Content value="schedule"><TabSchedule /></Tabs.Content>
      <Tabs.Content value="custom-1"><MarkdownProse content={competitionInfo.information} /></Tabs.Content>
      <Tabs.Content value="custom-2"><MarkdownProse content={competitionInfo.information} /></Tabs.Content>
      <Tabs.Content value="custom-3"><MarkdownProse content={competitionInfo.information} /></Tabs.Content>
      </Tabs.Root>
                
      
    </Container>
  );
}
