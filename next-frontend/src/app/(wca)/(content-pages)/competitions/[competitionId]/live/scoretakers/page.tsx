import PermissionCheck from "@/components/PermissionCheck";
import ScoretakerManager from "@/app/(wca)/(content-pages)/competitions/[competitionId]/live/scoretakers/ScoretakerManager";

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
    </PermissionCheck>
  );
}
