import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { Metadata } from "next";
import ConfirmProvider from "@/providers/ConfirmProvider";

type TitleProps = {
  params: Promise<{ competitionId: string }>;
};

export async function generateMetadata({
  params,
}: TitleProps): Promise<Metadata> {
  const { competitionId } = await params;

  const { data: competitionInfo, error } =
    await getCompetitionInfo(competitionId);

  if (error || !competitionInfo) return { title: "Competition Not Found" };

  return {
    title: `${competitionInfo.name}`,
  };
}

export default function CompetitionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConfirmProvider>{children}</ConfirmProvider>;
}
