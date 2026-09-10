import CompetitionMenu from "@/components/competitions/CompetitionMenu";
import TabShell from "@/components/competitions/TabShell";
import TabMenuSkeleton from "@/components/competitions/TabMenuSkeleton";
import { Box } from "@chakra-ui/react";
import { Suspense } from "react";

export default function CompetitionTabsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ competitionId: string }>;
}) {
  // The competition page layout is very card-heave, and Chakra cards bring their own padding.
  //   So we subtract a little bit of the global padding that we had previously applied to shared pages.
  return (
    <Box marginTop="-3">
      <TabShell
        menu={
          <Suspense fallback={<TabMenuSkeleton />}>
            <CompetitionMenu params={params} />
          </Suspense>
        }
      >
        {children}
      </TabShell>
    </Box>
  );
}
