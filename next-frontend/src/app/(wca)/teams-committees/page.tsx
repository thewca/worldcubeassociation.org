"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Container,
  Heading,
  Table,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useT } from "@/lib/i18n/useI18n";
import { useQuery } from "@tanstack/react-query";
import useAPI from "@/lib/wca/useAPI";
import Loading from "@/components/ui/loading";
import { Prose } from "@/components/ui/prose";
import { components } from "@/types/openapi";
import Link from "next/link";
import { usePermissions } from "@/providers/PermissionProvider";
import UserBadge from "@/components/UserBadge";

export default function TeamsCommitteesPage() {
  const I18n = useT();

  const api = useAPI();

  const { data: teamsCommittees, isLoading: teamsCommitteesLoading } = useQuery(
    {
      queryKey: ["teams_committees"],
      queryFn: () =>
        api.GET("/user_groups", {
          params: {
            query: {
              isActive: true,
              groupType: "teams_committees",
              isHidden: false,
            },
          },
        }),
    },
  );

  const isLoading = teamsCommitteesLoading;

  const groups = useMemo(() => teamsCommittees?.data ?? [], [teamsCommittees]);

  const [hash, setHash] = useState<string | null>("");

  const activeGroup = useMemo(
    () => groups.find((group) => group.metadata!.friendly_id === hash),
    [groups, hash],
  );

  const hashIsValid = Boolean(activeGroup);

  useEffect(() => {
    if (!isLoading && !hashIsValid) {
      if (groups.length > 0) {
        setHash(groups[0].metadata!.friendly_id!);
      } else {
        setHash(null);
      }
    }
  }, [isLoading, hashIsValid, groups, setHash]);

  if (isLoading || !activeGroup) return <Loading />;

  return (
    <Container>
      <VStack align={"left"} gap="8" width="full" pt="8" alignItems="left">
        <Heading size="5xl">
          {I18n.t("page.teams_committees_councils.title")}
        </Heading>
        <Prose>{I18n.t("page.teams_committees_councils.description")}</Prose>
        <Tabs.Root
          variant="enclosed"
          orientation="vertical"
          lazyMount
          fitted
          unmountOnExit
        >
          <Tabs.List height="fit-content" position="sticky" top="3">
            {groups.map((group) => (
              <Tabs.Trigger value={group.name} key={group.id}>
                {group.name}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          {groups.map((group) => (
            <Tabs.Content value={group.name} key={group.id} w={"full"}>
              <TeamTab group={group} />
            </Tabs.Content>
          ))}
        </Tabs.Root>
      </VStack>
    </Container>
  );
}

function TeamTab({ group }: { group: components["schemas"]["UserGroup"] }) {
  const I18n = useT();

  const { metadata, name, id } = group;
  const { friendly_id, email } = metadata!;
  const canReadGroupPast = usePermissions()?.canReadGroupPast(group.name);

  return (
    <VStack align={"left"}>
      <Heading size="2xl">{name}</Heading>
      <Text>
        {I18n.t(
          `page.teams_committees_councils.groups_description.${friendly_id}`,
        )}
      </Text>
      <Link href={`mailto:${email}`}>{email}</Link>
      <MemberTable id={id} />
      {canReadGroupPast && (
        <>
          <Heading size={"xl"}>Past Roles</Heading>
          <MemberTable id={id} isActive={false} />
        </>
      )}
    </VStack>
  );
}

function MemberTable({
  id,
  isActive = true,
}: {
  id: number;
  isActive?: boolean;
}) {
  const I18n = useT();
  const api = useAPI();

  const { data: roleRequest, isLoading } = useQuery({
    queryKey: ["roles", id, isActive],
    queryFn: () =>
      api.GET("/user_roles", {
        params: {
          query: {
            isActive: isActive,
            groupId: id,
          },
        },
      }),
  });

  const roles = useMemo(() => roleRequest?.data ?? [], [roleRequest]);

  if (isLoading) return <Loading />;

  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>
            {I18n.t("delegates_page.table.name")}
          </Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {roles.map((role) => (
          <Table.Row key={role.id}>
            <Table.Cell>
              <UserBadge
                key={role.id}
                profilePicture={role.user.avatar.url}
                name={role.user.name}
                wcaId={role.user.wca_id}
                roles={[
                  {
                    teamRole: I18n.t(
                      `enums.user_roles.status.${role.group.group_type}.${role.metadata.status}`,
                    ),
                    staffColor: "red",
                  },
                ]}
              />
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
