import { Container } from "@chakra-ui/react";
import type { Metadata } from "next";
import { getTranslatedRegulations } from "@/lib/wca/regulations/getRegulations";
import RegulationsViewer from "@/components/regulations/RegulationsViewer";
import OpenapiError from "@/components/ui/openapiError";
import { getT } from "@/lib/i18n/get18n";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ language: string }>;
}): Promise<Metadata> {
  const { language } = await params;
  return { title: `WCA Regulations (${language})` };
}

export default async function TranslatedRegulations({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const { language } = await params;

  const { t } = await getT();
  const { data, error, response } = await getTranslatedRegulations(language);

  if (error) return <OpenapiError response={response} t={t} />;

  return (
    <Container bg="bg">
      <RegulationsViewer contentHtml={data.content_html} />
    </Container>
  );
}
