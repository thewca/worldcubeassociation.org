import { getResultByPerson } from "@/lib/wca/live/getResultByPerson";
import ByPersonResults from "./ByPersonResults";
export default async function PersonResults({
  params,
}: {
  params: Promise<{ registrationId: string; competitionId: string }>;
}) {
  const { competitionId, registrationId } = await params;

  const personResultRequest = await getResultByPerson(
    competitionId,
    registrationId,
  );

  if (!personResultRequest.data) {
    return <p>Something went wrong while trying to fetch results</p>;
  }

  const { results } = personResultRequest.data;

  return (
    <>
      <ByPersonResults competitionId={competitionId} results={results} />
    </>
  );
}
