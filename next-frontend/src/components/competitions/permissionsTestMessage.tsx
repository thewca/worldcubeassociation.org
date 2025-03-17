"use client";

import Link from "next/link";
import { usePermissions } from "@/providers/PermissionProvider";
import { components } from "@/lib/wca/wcaSchema";
import { Text, Link as ChakraLink } from "@chakra-ui/react";

export default function PermissionsTestMessage({
  competitionInfo,
}: {
  competitionInfo: components["schemas"]["CompetitionInfo"];
}) {
  const permissions = usePermissions();

  return permissions?.canAdministerCompetition(competitionInfo.id) ? (
    <Text>
      You can administer this competition{" "}
      <ChakraLink asChild variant="underline" colorPalette="teal">
        <Link href={`/competitions/${competitionInfo.id}/admin`}>here</Link>
      </ChakraLink>
    </Text>
  ) : (
    <p> This is the public page, you cannot administer this competition</p>
  );
}
