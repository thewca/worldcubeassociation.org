import { Container } from "@chakra-ui/react";
import type { Metadata } from "next";
import { getHistoricalRegulations } from "@/lib/wca/regulations/getRegulations";
import RegulationsViewer from "@/components/regulations/RegulationsViewer";
import OpenapiError from "@/components/ui/openapiError";
import { getT } from "@/lib/i18n/get18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ version: string }>;
}): Promise<Metadata> {
  const { version } = await params;
  return { title: `WCA Regulations ${version}` };
}

export default async function HistoricalRegulation({
  params,
}: {
  params: Promise<{ version: string }>;
}) {
  const { version } = await params;

  const { t } = await getT();
  const { data, error, response } = await getHistoricalRegulations(version);

  if (error) return <OpenapiError response={response} t={t} />;

  return (
    <Container bg="bg">
      <RegulationsViewer contentHtml={data.content_html} />
    </Container>
  );
}
