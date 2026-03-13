"use client";

import { components } from "@/types/openapi";
import { duringCompetitionTabs } from "@/lib/wca/competitions/tabs";
import useAPI from "@/lib/wca/useAPI";
import Loading from "@/components/ui/loading";
import TabMenu from "@/components/competitions/TabMenu";

export default function LiveMenu({
  competitionInfo,
  children,
}: {
  children: React.ReactNode;
  competitionInfo: components["schemas"]["CompetitionInfo"];
}) {
  const api = useAPI();

  const { data, isLoading } = api.useQuery(
    "get",
    "/v1/competitions/{competitionId}/live/rounds",
    { params: { path: { competitionId: competitionInfo.id } } },
  );

  if (isLoading) {
    return <Loading />;
  }

  const tabs = duringCompetitionTabs(competitionInfo, data!.rounds);

  return (
    <TabMenu tabs={tabs} competitionInfo={competitionInfo}>
      {children}
    </TabMenu>
  );
}
