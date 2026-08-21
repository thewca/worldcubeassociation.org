import {
  Container,
  Heading,
  Link,
  SimpleGrid,
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
import UserBadge from "@/components/UserBadge";
import { Trans } from "react-i18next/TransWithoutContext";
import _ from "lodash";
import OpenapiError from "@/components/ui/openapiError";
import { Metadata } from "next";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("delegates_page.title"),
  };
}

export default async function DelegatesPage() {
  const { t } = await getT();

  const { data: delegateGroups, error, response } = await getDelegateRegions();

  if (error) return <OpenapiError response={response} t={t} />;

  const rootGroups = delegateGroups.filter(
    (group) => group.parent_group_id === null,
  );

  return (
    <Container bg="bg">
      <VStack align="left" gap="8" width="full" pt="8" alignItems="left">
        <Heading size="5xl">{t("delegates_page.title")}</Heading>
        <Trans
          parent={Prose}
          t={t}
          i18nKey="about.structure.delegates_html"
          values={{ see_link: "" }}
        />
        <Prose>{t("delegates_page.acknowledges")}</Prose>
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
            <Tabs.Content value={group.name} key={group.id} w="full">
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
    <VStack align="left">
      <Heading textStyle="h2">{name}</Heading>
      <Link href={`mailto:${email}`}>{email}</Link>
      <UserBadge
        key={lead_user!.id}
        profilePicture={lead_user!.avatar}
        name={lead_user!.name}
        wcaId={lead_user!.wca_id}
      />
      <MemberTable id={id} />
    </VStack>
  );
}

async function MemberTable({ id }: { id: number }) {
  const { t } = await getT();

  const {
    data: delegateRoles,
    error,
    response,
  } = await getDelegatesInGroups(id);

  if (error) return <OpenapiError response={response} t={t} />;

  const roles = _.groupBy(delegateRoles, "group.name");

  return _.map(roles, (delegates, region) => (
    <VStack align="left">
      <Heading size="xl">{region}</Heading>
      <SimpleGrid columns={2} gap={2}>
        {delegates.map((role) => (
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
                staffColor: "yellow",
              },
            ]}
          />
        ))}
      </SimpleGrid>
    </VStack>
  ));
}
