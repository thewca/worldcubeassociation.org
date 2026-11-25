import { Heading, SimpleGrid, Tabs, VStack } from "@chakra-ui/react";
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
import { route } from "nextjs-routes";
import getPermissions from "@/lib/wca/permissions.server";
import {
  RegionDelegates,
  SubregionDelegates,
} from "@/app/(wca)/(content-pages)/delegates/delegateLists";
import AdminModeToggle from "@/app/(wca)/(content-pages)/delegates/adminModeToggle";
import OpenapiError from "@/components/ui/openapiError";
import ResponsiveTabsList from "@/components/ui/responsiveTabsList";
import { Metadata } from "next";
import { Suspense } from "react";
import Loading from "@/components/ui/loading";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("delegates_page.title"),
  };
}

type DelegatesPageProps = {
  searchParams: Promise<{ region?: string; admin?: string }>;
};

export default function DelegatesPage({ searchParams }: DelegatesPageProps) {
  return (
    <Suspense fallback={<Loading />}>
      <Delegates searchParams={searchParams} />
    </Suspense>
  );
}

async function Delegates({ searchParams }: DelegatesPageProps) {
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

  const regionItems = rootGroups.flatMap((group) => {
    const friendlyId = group.metadata?.friendly_id;
    if (!friendlyId) return [];

    return [
      {
        value: friendlyId,
        label: group.name,
        href: route({
          pathname: "/delegates",
          query: isAdminMode
            ? { region: friendlyId, admin: "true" }
            : { region: friendlyId },
        }),
      },
    ];
  });

  return (
    <VStack align="left" gap="8" width="full" alignItems="left">
      <Heading size="5xl">{t("delegates_page.title")}</Heading>
      <Trans
        parent={Prose}
        t={t}
        i18nKey="about.structure.delegates_html"
        values={{ see_link: "" }}
      />
      <Prose>{t("delegates_page.acknowledges")}</Prose>
      {canViewAdminPage && (
        <AdminModeToggle region={activeFriendlyId} isAdminMode={isAdminMode} />
      )}
      <Tabs.Root
        variant="enclosed"
        orientation="vertical"
        sideNav
        fitted
        value={activeFriendlyId}
        gap={{ base: 8, md: 4 }}
      >
        <ResponsiveTabsList
          label={t("delegates_page.title")}
          items={regionItems}
        />
        <Tabs.Content value={activeFriendlyId} w="full">
          <DelegateTab group={activeGroup} isAdminMode={isAdminMode} />
        </Tabs.Content>
      </Tabs.Root>
    </VStack>
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
  const { name, id, lead_user } = group;

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

  return (
    <VStack align="left" gap="8">
      <VStack align="left" gap="4">
        <Heading textStyle="h2">{name}</Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <UserBadge
            t={t}
            key={lead_user!.id}
            profilePicture={lead_user!.avatar}
            name={lead_user!.name}
            wcaId={lead_user!.wca_id}
            email={lead_user?.email}
            roles={[
              {
                teamRole: t(
                  "enums.user_roles.status.delegate_regions.senior_delegate",
                ),
                staffColor: "yellow",
              },
            ]}
          />
        </SimpleGrid>
        <RegionDelegates
          key={id}
          groupId={id}
          initialRoles={regionRoles}
          isAdminMode={isAdminMode}
        />
      </VStack>
      <SubregionDelegates
        key={id}
        groupId={id}
        initialRoles={subregionRoles}
        isAdminMode={isAdminMode}
      />
    </VStack>
  );
}
