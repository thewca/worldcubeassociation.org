import { Button, ButtonGroup, ClientOnly, Link } from "@chakra-ui/react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import {
  LuChartNoAxesCombined,
  LuGalleryVertical,
  LuPrinter,
} from "react-icons/lu";
import ResultsPDF from "@/components/live/ResultsPdf";
import { components } from "@/types/openapi";

export default function PublicButtons({
  competitionId,
  roundId,
  formatId,
  results,
  competitors,
}: {
  competitionId: string;
  roundId: string;
  formatId: string;
  results: components["schemas"]["LiveResult"][];
  competitors: components["schemas"]["LiveCompetitor"][];
}) {
  return (
    <ButtonGroup>
      <Button asChild>
        <Link href={`/competitions/${competitionId}/live/rounds/${roundId}`}>
          <LuChartNoAxesCombined />
        </Link>
      </Button>
      <Button asChild>
        <ClientOnly>
          <PDFDownloadLink
            document={
              <ResultsPDF
                competitionId={competitionId}
                roundId={roundId}
                results={results}
                formatId={formatId}
                competitors={competitors}
              />
            }
            fileName="results.pdf"
          >
            <LuPrinter />
          </PDFDownloadLink>
        </ClientOnly>
      </Button>
      <Button asChild>
        <Link
          href={`/competitions/${competitionId}/live/rounds/${roundId}/double-check`}
        >
          <LuGalleryVertical />
        </Link>
      </Button>
    </ButtonGroup>
  );
}
