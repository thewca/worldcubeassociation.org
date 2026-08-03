import {
  Alert,
  Box,
  Card,
  Container,
  Heading,
  HStack,
  Link,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Metadata } from "next";
import { LuArrowLeft } from "react-icons/lu";
import { notFound } from "next/navigation";
import { ChakraMarkdown } from "@/components/Markdown";
import IncidentAdminButtons from "@/components/incidents/IncidentAdminButtons";
import { CompetitionTag, IncidentTags } from "@/components/incidents/Tags";
import { getIncident } from "@/lib/wca/incidents/getIncident";
import getPermissions from "@/lib/wca/permissions";
import { getFullDateTimeStringNoSeconds } from "@/lib/wca/dates";

type IncidentPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: IncidentPageProps): Promise<Metadata> {
  const { id } = await params;
  const { data: incident } = await getIncident(id);

  if (!incident) return { title: "Incident Not Found" };

  return { title: `Incident: ${incident.title}` };
}

export default async function IncidentPage({ params }: IncidentPageProps) {
  const { id } = await params;
  const { data: incident } = await getIncident(id);

  if (!incident) {
    notFound();
  }

  const permissions = await getPermissions();
  const canManageIncidents = Boolean(
    permissions?.canManageIncidents(incident.id),
  );
  const resolved = Boolean(incident.resolved_at);

  return (
    <Container bg="bg">
      <VStack gap="8" width="full" pt="8" alignItems="stretch">
        <Link href="/incidents">
          <LuArrowLeft />
          Back to the incidents log
        </Link>

        <Card.Root>
          <Card.Body>
            <VStack gap="8" width="full" alignItems="stretch">
              <Heading textStyle="h1">{incident.title}</Heading>

              <HStack gap="4" wrap="wrap">
                <Text as="span">
                  Status:{" "}
                  <Text
                    as="span"
                    fontWeight="bold"
                    color={resolved ? "green.fg" : "orange.fg"}
                  >
                    {resolved ? "Resolved" : "Pending"}
                  </Text>
                </Text>
                <IncidentTags tags={incident.tags} linkToSearch />
                {incident.competitions.map((competition) => (
                  <CompetitionTag
                    key={competition.id}
                    id={competition.id}
                    name={competition.name}
                    comments={competition.comments}
                  />
                ))}
                <Text>
                  {getFullDateTimeStringNoSeconds(incident.created_at)}
                </Text>
              </HStack>

              {!resolved && (
                <Alert.Root status="warning">
                  <Alert.Indicator />
                  <Alert.Title>
                    Note: This log has not been resolved yet, so it is not
                    publicly visible.
                  </Alert.Title>
                </Alert.Root>
              )}

              <Box>
                <Heading size="xl" mb="4">
                  Incident description and resolution
                </Heading>
                <ChakraMarkdown>{incident.public_summary}</ChakraMarkdown>
              </Box>

              {/* The API only returns the private fields to users who may read them. */}
              {incident.private_description !== undefined && (
                <Box>
                  <Heading size="xl" mb="4">
                    Description (private to Delegates)
                  </Heading>
                  <ChakraMarkdown>
                    {incident.private_description}
                  </ChakraMarkdown>
                </Box>
              )}

              {incident.private_wrc_decision !== undefined && (
                <Box>
                  <Heading size="xl" mb="4">
                    WRC Decision (private to Delegates)
                  </Heading>
                  <ChakraMarkdown>
                    {incident.private_wrc_decision}
                  </ChakraMarkdown>
                </Box>
              )}

              {canManageIncidents && (
                <IncidentAdminButtons
                  incidentId={incident.id}
                  resolved={resolved}
                />
              )}
            </VStack>
          </Card.Body>
        </Card.Root>
      </VStack>
    </Container>
  );
}
