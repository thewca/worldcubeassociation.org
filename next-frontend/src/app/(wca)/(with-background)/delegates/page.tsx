import {
  Container,
  Heading,
  IconButton,
  Link as ChakraLink,
  SimpleGrid,
  Tabs,
  VStack,
} from "@chakra-ui/react";
import { getT } from "@/lib/i18n/get18n";
import {
  getDelegateRegions,
  getDelegatesInGroup,
  getDelegatesInSubgroups,
} from "@/lib/wca/roles/delegateRegions";
import { Prose } from "@/components/ui/prose";
import { components } from "@/types/openapi";
import UserBadge from "@/components/UserBadge";
import { Trans } from "react-i18next/TransWithoutContext";
import _ from "lodash";
import Link from "next/link";
import { route } from "nextjs-routes";
import { LuPencil } from "react-icons/lu";
import getPermissions from "@/lib/wca/permissions.server";
import AdminModeToggle from "@/app/(wca)/(with-background)/delegates/adminModeToggle";
import OpenapiError from "@/components/ui/openapiError";
import { Metadata } from "next";

// Editing a user is still served by Rails, which sits at the root of the public API host.
const RAILS_ROOT_URL = new URL(process.env.NEXT_PUBLIC_WCA_FRONTEND_API_URL!)
  .origin;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("delegates_page.title"),
  };
}

export default async function DelegatesPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; admin?: string }>;
}) {
  const { t } = await getT();
  const { region, admin } = await searchParams;

  const [{ data: delegateGroups, error, response }, permissions] =
    await Promise.all([getDelegateRegions(), getPermissions()]);

  if (error) return <OpenapiError response={response} t={t} />;

  const canViewAdminPage = permissions?.canViewDelegateAdminPage() ?? false;
  const isAdminMode = canViewAdminPage && admin === "true";

  const rootGroups = delegateGroups.filter(
    (group) => group.parent_group_id === null,
  );

  const activeGroup =
    rootGroups.find((group) => group.metadata!.friendly_id === region) ??
    rootGroups[0];
  const activeFriendlyId = activeGroup.metadata!.friendly_id!;

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
        {canViewAdminPage && (
          <AdminModeToggle
            region={activeFriendlyId}
            isAdminMode={isAdminMode}
          />
        )}
        <Tabs.Root
          variant="enclosed"
          orientation="vertical"
          fitted
          value={activeFriendlyId}
        >
          <Tabs.List height="fit-content" position="sticky" top="3">
            {rootGroups.map((group) => {
              const friendlyId = group.metadata!.friendly_id!;

              return (
                <Tabs.Trigger value={friendlyId} key={group.id} asChild>
                  <Link
                    href={route({
                      pathname: "/delegates",
                      query: isAdminMode
                        ? { region: friendlyId, admin: "true" }
                        : { region: friendlyId },
                    })}
                  >
                    {group.name}
                  </Link>
                </Tabs.Trigger>
              );
            })}
          </Tabs.List>
          <Tabs.Content value={activeFriendlyId} w="full">
            <DelegateTab group={activeGroup} isAdminMode={isAdminMode} />
          </Tabs.Content>
        </Tabs.Root>
      </VStack>
    </Container>
  );
}

async function DelegateTab({
  group,
  isAdminMode,
}: {
  group: components["schemas"]["UserGroup"];
  isAdminMode: boolean;
}) {
  const { t } = await getT();
  const { metadata, name, id, lead_user } = group;
  const { email } = metadata!;

  const [regionResult, subregionResult] = await Promise.all([
    getDelegatesInGroup(id),
    getDelegatesInSubgroups(id),
  ]);

  const {
    data: regionRoles,
    error: regionError,
    response: regionResponse,
  } = regionResult;
  const {
    data: subregionRoles,
    error: subregionError,
    response: subregionResponse,
  } = subregionResult;

  if (regionError) return <OpenapiError response={regionResponse} t={t} />;
  if (subregionError)
    return <OpenapiError response={subregionResponse} t={t} />;

  const regionDelegates = listedDelegates(regionRoles, isAdminMode);
  const delegatesBySubregion = _.groupBy(
    listedDelegates(subregionRoles, isAdminMode),
    "group.name",
  );

  return (
    <VStack align="left">
      <Heading textStyle="h2">{name}</Heading>
      <ChakraLink href={`mailto:${email}`}>{email}</ChakraLink>
      <UserBadge
        key={lead_user!.id}
        profilePicture={lead_user!.avatar}
        name={lead_user!.name}
        wcaId={lead_user!.wca_id}
      />
      {regionDelegates.length > 0 && (
        <DelegateGrid delegates={regionDelegates} isAdminMode={isAdminMode} />
      )}
      {_.map(delegatesBySubregion, (delegates, subregion) => (
        <VStack align="left" key={subregion}>
          <Heading size="xl">{subregion}</Heading>
          <DelegateGrid delegates={delegates} isAdminMode={isAdminMode} />
        </VStack>
      ))}
    </VStack>
  );
}

// Trainee Delegates are only listed in admin mode, and the senior Delegate is already shown as the
// region lead.
function listedDelegates(
  roles: components["schemas"]["UserRole"][],
  isAdminMode: boolean,
) {
  return roles.filter(
    (role) =>
      role.metadata.status !== "senior_delegate" &&
      (isAdminMode || role.metadata.status !== "trainee_delegate"),
  );
}

async function DelegateGrid({
  delegates,
  isAdminMode,
}: {
  delegates: components["schemas"]["UserRole"][];
  isAdminMode: boolean;
}) {
  const { t } = await getT();

  return (
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
          action={
            isAdminMode && (
              <IconButton
                asChild
                variant="ghost"
                size="sm"
                aria-label={`Edit ${role.user.name}`}
              >
                <ChakraLink
                  href={`${RAILS_ROOT_URL}/users/${role.user.id}/edit`}
                >
                  <LuPencil />
                </ChakraLink>
              </IconButton>
            )
          }
        />
      ))}
    </SimpleGrid>
  );
}
