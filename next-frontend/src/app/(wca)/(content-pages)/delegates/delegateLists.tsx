"use client";

import _ from "lodash";
import { Heading, IconButton, SimpleGrid, VStack } from "@chakra-ui/react";
import { LuPencil } from "react-icons/lu";
import InfiniteScrollSentinel from "@/components/InfiniteScrollSentinel";
import RailsLink from "@/components/RailsLink";
import UserBadge from "@/components/UserBadge";
import { useT } from "@/lib/i18n/useI18n";
import useInfiniteUserRoles from "@/lib/wca/roles/useInfiniteUserRoles";
import {
  delegatesInGroupQuery,
  delegatesInSubgroupsQuery,
} from "@/lib/wca/roles/userRolesQuery";
import { components } from "@/types/openapi";

interface DelegateListProps {
  groupId: number;
  initialRoles: components["schemas"]["UserRole"][];
  isAdminMode: boolean;
}

export function RegionDelegates({
  groupId,
  initialRoles,
  isAdminMode,
}: DelegateListProps) {
  const { roles, pagination } = useInfiniteUserRoles(
    delegatesInGroupQuery(groupId),
    initialRoles,
  );

  const delegates = listedDelegates(roles, isAdminMode);

  return (
    <>
      {delegates.length > 0 && (
        <DelegateGrid delegates={delegates} isAdminMode={isAdminMode} />
      )}
      <InfiniteScrollSentinel {...pagination} />
    </>
  );
}

export function SubregionDelegates({
  groupId,
  initialRoles,
  isAdminMode,
}: DelegateListProps) {
  const { roles, pagination } = useInfiniteUserRoles(
    delegatesInSubgroupsQuery(groupId),
    initialRoles,
  );

  const delegatesBySubregion = _.groupBy(
    listedDelegates(roles, isAdminMode),
    "group.name",
  );

  return (
    <>
      {_.map(delegatesBySubregion, (delegates, subregion) => (
        <VStack align="left" key={subregion}>
          <Heading size="xl">{subregion}</Heading>
          <DelegateGrid delegates={delegates} isAdminMode={isAdminMode} />
        </VStack>
      ))}
      <InfiniteScrollSentinel {...pagination} />
    </>
  );
}

function listedDelegates(
  roles: components["schemas"]["UserRole"][],
  isAdminMode: boolean,
) {
  const regionalDelegateUserIds = new Set(
    roles
      .filter((role) => role.metadata.status === "regional_delegate")
      .map((role) => role.user.id),
  );

  return roles.filter(
    (role) =>
      // Senior Delegates are shown as region leads at the top of the list
      role.metadata.status !== "senior_delegate" &&
      (isAdminMode || role.metadata.status !== "trainee_delegate") &&
      // Avoid showing regional delegates twice in the same category
      (!regionalDelegateUserIds.has(role.user.id) ||
        role.metadata.status !== "delegate"),
  );
}

function DelegateGrid({
  delegates,
  isAdminMode,
}: {
  delegates: components["schemas"]["UserRole"][];
  isAdminMode: boolean;
}) {
  const { t } = useT();

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
      {delegates.map((role) => (
        <UserBadge
          t={t}
          key={role.id}
          profilePicture={role.user.avatar}
          name={role.user.name}
          wcaId={role.user.wca_id}
          email={role.user.email}
          roles={[
            {
              teamRole: t(
                `enums.user_roles.status.${role.group.group_type}.${role.metadata.status}`,
              ),
              teamText: role.metadata.location,
              staffColor: "yellow",
            },
          ]}

          action={
            isAdminMode && (
              <IconButton
                asChild
                variant="ghost"
                size="sm"
                aria-label={
                  // eslint-disable-next-line no-restricted-syntax -- Backoffice-only text
                  `Edit ${role.user.name}`
                }
              >
                <RailsLink href={`/users/${role.user.id}/edit`}>
                  <LuPencil />
                </RailsLink>
              </IconButton>
            )
          }
        />
      ))}
    </SimpleGrid>
  );
}
