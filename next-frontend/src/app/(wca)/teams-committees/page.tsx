import {
  Container,
  Heading,
  Link,
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
import Errored from "@/components/ui/errored";
import getPermissions from "@/lib/wca/permissions";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("page.teams_committees_councils.title"),
  };
}

export default async function TeamsCommitteesPage() {
  const { t } = await getT();

  const { data: teamsCommittees, error, response } = await getTeamsCommittees();

  if (error) return <Errored response={response} t={t} />;

  return (
    <Container bg="bg">
      <VStack align="left" gap="8" width="full" pt="8" alignItems="left">
        <Heading size="5xl">
          {t("page.teams_committees_councils.title")}
        </Heading>
        <Prose>{t("page.teams_committees_councils.description")}</Prose>
        <Tabs.Root
          variant="enclosed"
          orientation="vertical"
          lazyMount
          fitted
          unmountOnExit
        >
          <Tabs.List height="fit-content" position="sticky" top="3">
            {teamsCommittees.map((group) => (
              <Tabs.Trigger value={group.name} key={group.id}>
                {group.name}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          {teamsCommittees.map((group) => (
            <Tabs.Content value={group.name} key={group.id} w="full">
              <TeamTab group={group} />
            </Tabs.Content>
          ))}
        </Tabs.Root>
      </VStack>
    </Container>
  );
}

async function TeamTab({
  group,
}: {
  group: components["schemas"]["UserGroup"];
}) {
  const { t } = await getT();

  const { metadata, name, id } = group;
  const { friendly_id, email } = metadata!;

  const permissions = await getPermissions();
  const canReadGroupPast = permissions?.canReadGroupPast(group.name);

  return (
    <VStack align="left">
      <Heading size="2xl">{name}</Heading>
      <Text>
        {t(`page.teams_committees_councils.groups_description.${friendly_id}`)}
      </Text>
      <Link href={`mailto:${email}`}>{email}</Link>
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

  if (error) return <Errored response={response} t={t} />;

  return (
    <SimpleGrid columns={{ md: 1, sm: 1, lg: 2 }} gap="20px">
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
