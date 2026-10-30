import CompetitionMenu, {
  AwaitingResultsAlert,
} from "@/components/competitions/CompetitionMenu";
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
  // width=full so tables won't overflow a tab
  return (
    <Box marginTop="-3" width="full">
      <TabShell
        menu={
          <Suspense fallback={<TabMenuSkeleton />}>
            <CompetitionMenu params={params} />
          </Suspense>
        }
      >
        <Suspense>
          <AwaitingResultsAlert params={params} />
        </Suspense>
        {children}
      </TabShell>
    </Box>
  );
}
