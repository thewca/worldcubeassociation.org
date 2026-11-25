"use client";

import { SimpleGrid } from "@chakra-ui/react";
import InfiniteScrollSentinel from "@/components/InfiniteScrollSentinel";
import UserBadge from "@/components/UserBadge";
import { useT } from "@/lib/i18n/useI18n";
import useInfiniteUserRoles from "@/lib/wca/roles/useInfiniteUserRoles";
import { teamCommitteeMembersQuery } from "@/lib/wca/roles/userRolesQuery";
import { components } from "@/types/openapi";

export default function MemberGrid({
  groupId,
  isActive,
  initialRoles,
}: {
  groupId: number;
  isActive: boolean;
  initialRoles: components["schemas"]["UserRole"][];
}) {
  const { t } = useT();
  const { roles, pagination } = useInfiniteUserRoles(
    teamCommitteeMembersQuery(groupId, isActive),
    initialRoles,
  );

  return (
    <>
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap="4">
        {roles.map((role) => (
          <UserBadge
            t={t}
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
      <InfiniteScrollSentinel {...pagination} />
    </>
  );
}
