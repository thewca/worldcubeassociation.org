import { getT } from "@/lib/i18n/get18n";
import OpenapiError from "../ui/openapiError";
import Content from "./PageContent";
import { getCompetitionMenuData } from "@/lib/competitionMenu/getCompetitionMenuData";

export default async function PageContentWrapper({
  params,
  children,
}: {
  params: Promise<{ competitionId: string }>;
  children: React.ReactNode;
}) {
  const { competitionId } = await params;
  const { t } = await getT();

  const menu = await getCompetitionMenuData(competitionId);

  if (!menu.ok) return <OpenapiError t={t} response={menu.response} />;
  return (
    <Content tabs={menu.tabs} competition={menu.competitionInfo}>
      {children}
    </Content>
  );
}
