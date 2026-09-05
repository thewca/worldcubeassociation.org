import {
  Alert,
  Box,
  Card,
  Container,
  Heading,
  HStack,
  Link,
  Status,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Metadata } from "next";
import { LuArrowLeft } from "react-icons/lu";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import IncidentAdminButtons from "@/components/incidents/IncidentAdminButtons";
import IncidentMarkdown from "@/components/incidents/IncidentMarkdown";
import { CompetitionTag, IncidentTags } from "@/components/incidents/Tags";
import { getIncident } from "@/lib/wca/incidents/getIncident";
import getPermissions from "@/lib/wca/permissions";
import { getFullDateTimeStringNoSeconds } from "@/lib/wca/dates";
import { getT } from "@/lib/i18n/get18n";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

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

  return { title: t("incidents_log.page_title", { title: incident.title }) };
}

export default async function IncidentPage({ params }: IncidentPageProps) {
  const { id } = await params;
  const { data: incident } = await getIncident(id);

  if (!incident) {
    notFound();
  }

  const { t } = await getT();
  const permissions = await getPermissions();
  const canManageIncidents = permissions?.canManageIncidents() ?? false;
  const resolved = Boolean(incident.resolved_at);

  return (
    <Container bg="bg">
      <VStack gap="8" width="full" pt="8" alignItems="stretch">
        <Link asChild>
          <NextLink href="/incidents">
            <LuArrowLeft />
            {t("incidents_log.back_to_log")}
          </NextLink>
        </Link>

        <Card.Root>
          <Card.Body>
            <VStack gap="8" width="full" alignItems="stretch">
              <Heading textStyle="h1">{incident.title}</Heading>

              <HStack gap="4" wrap="wrap">
                <HStack gap="1">
                  <Text as="span">{t("incidents_log.status")}:</Text>
                  <Status.Root colorPalette={resolved ? "green" : "orange"}>
                    <Status.Indicator />
                    {resolved
                      ? t("incidents_log.resolved")
                      : t("incidents_log.pending")}
                  </Status.Root>
                </HStack>
                <IncidentTags
                  tags={incident.tags}
                  action={{ kind: "linkToLog" }}
                />
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
                <Heading textStyle="h2" mb="4">
                  {t("incidents_log.public_summary")}
                </Heading>
                <IncidentMarkdown>{incident.public_summary}</IncidentMarkdown>
              </Box>

              {/* The API only returns the private fields to users who may read them. */}
              {incident.private_description !== undefined && (
                <Box>
                  <Heading textStyle="h2" mb="4">
                    {t("incidents_log.private_description")}
                  </Heading>
                  <IncidentMarkdown>
                    {incident.private_description}
                  </IncidentMarkdown>
                </Box>
              )}

              {incident.private_wrc_decision !== undefined && (
                <Box>
                  <Heading textStyle="h2" mb="4">
                    {t("incidents_log.private_wrc_decision")}
                  </Heading>
                  <IncidentMarkdown>
                    {incident.private_wrc_decision}
                  </IncidentMarkdown>
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
