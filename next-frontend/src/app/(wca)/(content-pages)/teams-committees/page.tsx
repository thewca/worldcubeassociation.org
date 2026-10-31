import {
  Heading,
  HStack,
  SimpleGrid,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react";
import { getT } from "@/lib/i18n/get18n";
import { Prose } from "@/components/ui/prose";
import { components } from "@/types/openapi";
import UserBadge from "@/components/UserBadge";
import {
  getTeamCommitteeMembers,
  getTeamsCommittees,
} from "@/lib/wca/roles/teamsCommittees";
import OpenapiError from "@/components/ui/openapiError";
import getPermissions from "@/lib/wca/permissions.server";
import { Metadata } from "next";
import EmailCopyButton from "@/components/EmailCopyButton";
import ResponsiveTabsList from "@/components/ui/responsiveTabsList";
import { route } from "nextjs-routes";

type GroupWithFriendlyId = components["schemas"]["UserGroup"] & {
  metadata: { friendly_id: string };
};

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("page.teams_committees_councils.title"),
  };
}

export default async function TeamsCommitteesPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const { t } = await getT();
  const { team } = await searchParams;

  const { data: teamsCommittees, error, response } = await getTeamsCommittees();

  if (error) return <OpenapiError response={response} t={t} />;

  const selectableTeams = teamsCommittees.filter(
    (group): group is GroupWithFriendlyId =>
      Boolean(group.metadata?.friendly_id),
  );

  if (!selectableTeams.length) {
    return <Text>{t("page.teams_committees_councils.empty")}</Text>;
  }

  const activeTeam =
    selectableTeams.find((group) => group.metadata.friendly_id === team) ??
    selectableTeams[0];

  const teamItems = selectableTeams.map((group) => ({
    value: group.metadata.friendly_id,
    label: group.name,
    href: route({
      pathname: "/teams-committees",
      query: { team: group.metadata.friendly_id },
    }),
  }));

  return (
    <VStack align="left" gap="8" width="full" alignItems="left">
      <Heading size="5xl">{t("page.teams_committees_councils.title")}</Heading>
      <Prose>{t("page.teams_committees_councils.description")}</Prose>
      <Tabs.Root
        variant="enclosed"
        orientation="vertical"
        value={activeTeam.metadata.friendly_id}
        sideNav
        lazyMount
        fitted
        unmountOnExit
        gap={{ base: 8, md: 4 }}
      >
        <ResponsiveTabsList
          label={t("page.teams_committees_councils.title")}
          items={teamItems}
        />
        <Tabs.Content value={activeTeam.metadata.friendly_id} w="full">
          <TeamTab group={activeTeam} />
        </Tabs.Content>
      </Tabs.Root>
    </VStack>
  );
}

async function TeamTab({ group }: { group: GroupWithFriendlyId }) {
  const { t } = await getT();

  const { metadata, name, id } = group;
  const { friendly_id, email, preferred_contact_mode } = metadata;

  const permissions = await getPermissions();
  const canReadGroupPast = permissions?.canReadGroupPast(group.name);

  return (
    <VStack align="left" gap="4">
      <VStack align="stretch" gap="2">
        <HStack gap="2">
          <Heading size="2xl">{name}</Heading>
          {email && preferred_contact_mode !== "no_contact" && (
            <EmailCopyButton email={email} />
          )}
        </HStack>
        <Text>
          {t(
            `page.teams_committees_councils.groups_description.${friendly_id}`,
          )}
        </Text>
      </VStack>
      <MemberTable id={id} />
      {canReadGroupPast && (
        <>
          <Heading size="xl">Past Roles</Heading>
          <MemberTable id={id} isActive={false} />
        </>
      )}
    </VStack>
  );
}

async function MemberTable({
  id,
  isActive = true,
}: {
  id: number;
  isActive?: boolean;
}) {
  const { t } = await getT();

  const {
    data: roles,
    error,
    response,
  } = await getTeamCommitteeMembers(id, isActive);

  if (error) return <OpenapiError response={response} t={t} />;

  return (
    <SimpleGrid columns={{ md: 1, sm: 1, lg: 2 }} gap="4">
      {roles.map((role) => (
        <UserBadge
          key={role.id}
          profilePicture={role.user.avatar}
          name={role.user.name}
          wcaId={role.user.wca_id}
          roles={[
            {
              teamRole: t(
                `enums.user_roles.status.${role.group.group_type}.${role.metadata.status}`,
              ),
              staffColor: "red",
            },
          ]}
        />
      ))}
    </SimpleGrid>
  );
}
