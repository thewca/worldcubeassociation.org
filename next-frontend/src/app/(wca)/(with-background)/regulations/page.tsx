import { Container } from "@chakra-ui/react";
import type { Metadata } from "next";
import { getRegulations } from "@/lib/wca/regulations/getRegulations";
import RegulationsViewer from "@/components/regulations/RegulationsViewer";
import OpenapiError from "@/components/ui/openapiError";
import { getT } from "@/lib/i18n/get18n";

export const metadata: Metadata = { title: "WCA Regulations" };

export default async function Regulations() {
  const { t } = await getT();
  const { data, error, response } = await getRegulations();

  if (error) return <OpenapiError response={response} t={t} />;

  return (
    <Container bg="bg">
      <RegulationsViewer contentHtml={data.content_html} />
    </Container>
  );
}
