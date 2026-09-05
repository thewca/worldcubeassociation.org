import PermissionCheck from "@/components/PermissionCheck";
import RoundAdmin from "@/app/(wca)/(with-background)/competitions/[competitionId]/live/admin/RoundAdmin";
import { Toaster } from "@/components/ui/toaster";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function LiveOverview({
  params,
}: {
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;

  return (
    <PermissionCheck
      requiredPermission="canScoretakeCompetition"
      item={competitionId}
    >
      <RoundAdmin competitionId={competitionId} />
      <Toaster />
    </PermissionCheck>
  );
}
