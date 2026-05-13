import PermissionCheck from "@/components/PermissionCheck";
import RoundAdmin from "@/app/(wca)/competitions/[competitionId]/live/admin/RoundAdmin";
import { Toaster } from "@/components/ui/toaster";

export default async function LiveOverview({
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
      <RoundAdmin competitionId={competitionId} />
      <Toaster />
    </PermissionCheck>
  );
}
