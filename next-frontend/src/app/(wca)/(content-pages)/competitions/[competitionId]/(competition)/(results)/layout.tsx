import { GridItem, SimpleGrid } from "@chakra-ui/react";
import MarkdownFirstImage from "@/components/MarkdownFirstImage";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { getT } from "@/lib/i18n/get18n";
import OpenapiError from "@/components/ui/openapiError";

export default async function CompetitionLayout({
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

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} gap="8">
      <MarkdownFirstImage content={competitionInfo.information} />
      <GridItem colSpan={{ base: 1, md: 3 }}>{children}</GridItem>
    </SimpleGrid>
  );
}
