import PermissionCheck from "@/components/PermissionCheck";
import ScoretakerManager from "@/app/(wca)/(with-background)/competitions/[competitionId]/live/scoretakers/ScoretakerManager";
import { Toaster } from "@/components/ui/toaster";

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
