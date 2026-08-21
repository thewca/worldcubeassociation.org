import PermissionCheck from "@/components/PermissionCheck";
import ScoretakerManager from "@/app/(wca)/(with-background)/competitions/[competitionId]/live/scoretakers/ScoretakerManager";
import { Toaster } from "@/components/ui/toaster";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function ScoretakersPage({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;

  return (
    <PermissionCheck
      requiredPermission="canAdministerCompetition"
      item={competitionId}
    >
      <ScoretakerManager competitionId={competitionId} />
      <Toaster />
    </PermissionCheck>
  );
}
