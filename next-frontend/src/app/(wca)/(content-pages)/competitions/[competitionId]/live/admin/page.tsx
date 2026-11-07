import PermissionCheck from "@/components/PermissionCheck";
import RoundAdmin from "@/app/(wca)/(content-pages)/competitions/[competitionId]/live/admin/RoundAdmin";

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
    </PermissionCheck>
  );
}
