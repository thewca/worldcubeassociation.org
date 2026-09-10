import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { getT } from "@/lib/i18n/get18n";
import OpenapiError from "@/components/ui/openapiError";
import CompetitionMenu from "@/components/competitions/CompetitionMenu";
import { Box } from "@chakra-ui/react";

export default async function CompetitionTabsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ competitionId: string }>;
}) {
  const { competitionId } = await params;
  const { t } = await getT();
  const {
    data: competitionInfo,
    error,
    response,
  } = await getCompetitionInfo(competitionId);

  if (error) return <OpenapiError t={t} response={response} />;

  // The competition page layout is very card-heave, and Chakra cards bring their own padding.
  //   So we subtract a little bit of the global padding that we had previously applied to shared pages.
  return (
    <Box marginTop="-3">
      <CompetitionMenu competitionInfo={competitionInfo}>
        {children}
      </CompetitionMenu>
    </Box>
  );
}
