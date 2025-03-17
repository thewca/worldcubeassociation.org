"use client";

import Link from "next/link";
import { usePermissions } from "@/providers/PermissionProvider";
import { components } from "@/lib/wca/wcaSchema";

export default function PermissionsTestMessage({
  competitionInfo,
}: {
  competitionInfo: components["schemas"]["CompetitionInfo"];
}) {
  const permissions = usePermissions();

  return permissions?.canAdministerCompetition(competitionInfo.id) ? (
    <p>
      {" "}
      You can administer this competition{" "}
      <Link
        href={`/next-frontend/src/app/(wca)/competitions/${competitionInfo.id}/admin`}
      >
        here
      </Link>
    </p>
  ) : (
    <p> This is the public page, you cannot administer this competition</p>
  );
}
