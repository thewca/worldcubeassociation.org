import { GridItem, SimpleGrid } from "@chakra-ui/react";
import { SubPageCard } from "@/components/competitions/Cards";
import MarkdownFirstImage, {
  extractMarkdownImage,
} from "@/components/MarkdownFirstImage";
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

  const mainColSpan = extractMarkdownImage(competitionInfo.information) ? 2 : 3;

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} gap="8">
      <GridItem colSpan={{ base: 1, md: mainColSpan }} asChild>
        <SubPageCard competitionInfo={competitionInfo} t={t} />
      </GridItem>
      <MarkdownFirstImage content={competitionInfo.information} />
      <GridItem colSpan={{ base: 1, md: 3 }}>{children}</GridItem>
    </SimpleGrid>
  );
}
