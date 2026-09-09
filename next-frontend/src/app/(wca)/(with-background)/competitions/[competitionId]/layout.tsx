import { Box } from "@chakra-ui/react";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import { Metadata } from "next";
import ConfirmProvider from "@/providers/ConfirmProvider";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

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
  return (
    <Box pt="8">
      <ConfirmProvider>{children}</ConfirmProvider>
    </Box>
  );
}
