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
import { getT } from "@/lib/i18n/get18n";

type IncidentPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: IncidentPageProps): Promise<Metadata> {
  const { id } = await params;
  const { data: incident } = await getIncident(id);
  const { t } = await getT();

  if (!incident) return { title: t("incidents_log.not_found") };

  return { title: `${t("incidents_log.incident")} ${incident.title}` };
}

export default async function IncidentPage({ params }: IncidentPageProps) {
  const { id } = await params;
  const { data: incident } = await getIncident(id);

  if (!incident) {
    notFound();
  }

  const { t } = await getT();
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
          {t("incidents_log.back_to_log")}
        </Link>

        <Card.Root>
          <Card.Body>
            <VStack gap="8" width="full" alignItems="stretch">
              <Heading textStyle="h1">{incident.title}</Heading>

              <HStack gap="4" wrap="wrap">
                <Text as="span">
                  {t("incidents_log.status")}:{" "}
                  <Text
                    as="span"
                    fontWeight="bold"
                    color={resolved ? "green.fg" : "orange.fg"}
                  >
                    {resolved
                      ? t("incidents_log.resolved")
                      : t("incidents_log.pending")}
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
                    {t("incidents_log.not_public_warning")}
                  </Alert.Title>
                </Alert.Root>
              )}

              <Box>
                <Heading size="xl" mb="4">
                  {t("incidents_log.public_summary")}
                </Heading>
                <ChakraMarkdown>{incident.public_summary}</ChakraMarkdown>
              </Box>

              {/* The API only returns the private fields to users who may read them. */}
              {incident.private_description !== undefined && (
                <Box>
                  <Heading size="xl" mb="4">
                    {t("incidents_log.private_description")}
                  </Heading>
                  <ChakraMarkdown>
                    {incident.private_description}
                  </ChakraMarkdown>
                </Box>
              )}

              {incident.private_wrc_decision !== undefined && (
                <Box>
                  <Heading size="xl" mb="4">
                    {t("incidents_log.private_wrc_decision")}
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
