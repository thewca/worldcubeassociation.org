import PermissionCheck from "@/components/PermissionCheck";
import RoundAdmin from "@/app/(wca)/(with-background)/competitions/[competitionId]/live/admin/RoundAdmin";
import { Toaster } from "@/components/ui/toaster";

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
