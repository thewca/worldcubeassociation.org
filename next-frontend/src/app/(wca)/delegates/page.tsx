import {
  Center,
  Container,
  Heading,
  Table,
  Tabs,
  VStack,
} from "@chakra-ui/react";
import { getT } from "@/lib/i18n/get18n";
import {
  getDelegateRegions,
  getDelegatesInGroups,
} from "@/lib/wca/roles/delegateRegions";
import { Prose } from "@/components/ui/prose";
import { components } from "@/types/openapi";
import Link from "next/link";
import UserBadge from "@/components/UserBadge";
import I18nHTMLTranslate from "@/components/I18nHTMLTranslate";
import _ from "lodash";
import Errored from "@/components/ui/errored";

export default async function DelegatesPage() {
  const { t } = await getT();

  const { data: delegateGroups, error } = await getDelegateRegions();

  if (error) return <Errored error={error} />;

  const rootGroups = delegateGroups.filter(
    (group) => group.parent_group_id === null,
  );

  return (
    <Container>
      <VStack align={"left"} gap="8" width="full" pt="8" alignItems="left">
        <Heading size="5xl">{t("delegates_page.title")}</Heading>
        <I18nHTMLTranslate
          i18nKey="about.structure.delegates_html"
          options={{ see_link: "" }}
          as={Prose}
        />
        <I18nHTMLTranslate i18nKey="delegates_page.acknowledges" as={Prose} />
        <Tabs.Root
          variant="enclosed"
          orientation="vertical"
          lazyMount
          fitted
          unmountOnExit
        >
          <Tabs.List height="fit-content" position="sticky" top="3">
            {rootGroups.map((group) => (
              <Tabs.Trigger value={group.name} key={group.id}>
                {group.name}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          {rootGroups.map((group) => (
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

async function MemberTable({ id }: { id: number }) {
  const { t } = await getT();

  const { data: delegateRoles, error } = await getDelegatesInGroups(id);

  if (error) return <Errored error={error} />;

  const roles = _.groupBy(delegateRoles, "group.name");

  return _.map(roles, (delegates, region) => (
    <VStack>
      <Heading size={"xl"}>{region}</Heading>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>
              {t("delegates_page.table.name")}
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
                      teamRole: t(
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
