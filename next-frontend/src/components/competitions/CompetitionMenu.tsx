import { components } from "@/types/openapi";
import { hasPassed } from "@/lib/wca/dates";
import {
  afterCompetitionTabs,
  beforeCompetitionTabs,
} from "@/lib/wca/competitions/tabs";
import TabMenu from "@/components/competitions/TabMenu";
import LiveMenu from "@/components/competitions/LiveMenu";
import { Alert, Link } from "@chakra-ui/react";
import I18nHTMLTranslate from "@/components/I18nHTMLTranslate";

const LIVE_RESULT_BETA = !!process.env.LIVE_RESULT_BETA;

export default function CompetitionMenu({
  competitionInfo,
  children,
}: {
  children: React.ReactNode;
  competitionInfo: components["schemas"]["CompetitionInfo"];
}) {
  const { scoretaking_software } = competitionInfo;
  if (scoretaking_software !== "internal" && LIVE_RESULT_BETA) {
    return (
      <Alert.Root status="error">
        <Alert.Indicator />
        <Alert.Content>
          <I18nHTMLTranslate
            i18nKey={`competitions.live.incompatible.${scoretaking_software}`}
          />
          {scoretaking_software === "wca_live" && (
            <>
              {" "}
              <Link
                href={`https://live.worldcubeassociation.org/link/competitions/${competitionInfo.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {competitionInfo.id}
              </Link>
            </>
          )}
        </Alert.Content>
      </Alert.Root>
    );
  }

  if (!hasPassed(competitionInfo.start_date)) {
    const tabs = beforeCompetitionTabs(competitionInfo);
    return (
      <TabMenu competitionInfo={competitionInfo} tabs={tabs}>
        {children}
      </TabMenu>
    );
  }

  if (!hasPassed(competitionInfo.end_date) || LIVE_RESULT_BETA) {
    return <LiveMenu competitionInfo={competitionInfo}>{children}</LiveMenu>;
  }
  // TODO: Differentiate if the results have been posted
  const tabs = afterCompetitionTabs(competitionInfo);
  return (
    <TabMenu competitionInfo={competitionInfo} tabs={tabs}>
      {children}
    </TabMenu>
  );
}
