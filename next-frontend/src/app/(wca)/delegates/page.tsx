"use client";

import { useMemo } from "react";
import {
  Center,
  Container,
  Heading,
  Table,
  Tabs,
  VStack,
} from "@chakra-ui/react";
import { useT } from "@/lib/i18n/useI18n";
import { useQuery } from "@tanstack/react-query";
import useAPI from "@/lib/wca/useAPI";
import Loading from "@/components/ui/loading";
import { Prose } from "@/components/ui/prose";
import { components } from "@/types/openapi";
import Link from "next/link";
import UserBadge from "@/components/UserBadge";
import I18nHTMLTranslate from "@/components/I18nHTMLTranslate";
import _ from "lodash";

export default function TeamsCommitteesPage() {
  const I18n = useT();

  const api = useAPI();

  const { data: delegateRequest, isLoading } = useQuery({
    queryKey: ["delegate_regions"],
    queryFn: () =>
      api.GET("/user_groups", {
        params: {
          query: {
            isActive: true,
            groupType: "delegate_regions",
          },
        },
      }),
    select(request) {
      return request.data!.filter((group) => group.parent_group_id === null);
    },
  });

  const groups = useMemo(() => delegateRequest ?? [], [delegateRequest]);

  if (isLoading) return <Loading />;

  return (
    <Container>
      <VStack align={"left"} gap="8" width="full" pt="8" alignItems="left">
        <Heading size="5xl">{I18n.t("delegates_page.title")}</Heading>
        <Prose>
          <I18nHTMLTranslate
            i18nKey="about.structure.delegates_html"
            options={{ see_link: "" }}
          />
        </Prose>
        <Prose>
          <I18nHTMLTranslate i18nKey="delegates_page.acknowledges" />
        </Prose>
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
              <DelegateTab group={group} />
            </Tabs.Content>
          ))}
        </Tabs.Root>
      </VStack>
    </Container>
  );
}

function DelegateTab({ group }: { group: components["schemas"]["UserGroup"] }) {
  const { metadata, name, id, lead_user } = group;
  const { email } = metadata!;

  return (
    <VStack align={"left"}>
      <Heading size="2xl">{name}</Heading>
      <Link href={`mailto:${email}`}>{email}</Link>
      <Center>
        <UserBadge
          key={lead_user!.id}
          profilePicture={lead_user!.avatar.url}
          name={lead_user!.name}
          wcaId={lead_user!.wca_id}
        />
      </Center>
      <MemberTable id={id} />
    </VStack>
  );
}

function MemberTable({ id }: { id: number }) {
  const I18n = useT();
  const api = useAPI();

  const { data: roles, isLoading } = useQuery({
    queryKey: ["roles", id],
    queryFn: () =>
      api.GET("/user_roles", {
        params: {
          query: {
            parentGroupId: id,
            isActive: true,
            sort: "location,name",
          },
        },
      }),
    select(request) {
      return _.groupBy(request.data!, "group.name");
    },
  });

  if (isLoading) return <Loading />;

  return _.map(roles, (delegates, region) => (
    <VStack>
      <Heading size={"xl"}>{region}</Heading>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>
              {I18n.t("delegates_page.table.name")}
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {delegates.map((role) => (
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
                      staffColor: "yellow",
                    },
                  ]}
                />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </VStack>
  ));
}
