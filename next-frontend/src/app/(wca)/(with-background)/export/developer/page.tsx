import { VStack, Container, Heading, Text, Link } from "@chakra-ui/react";
import { getT } from "@/lib/i18n/get18n";
import { getExportDetails } from "@/lib/wca/exports/getExportDetails";
import Loading from "@/components/ui/loading";
import OpenapiError from "@/components/ui/openapiError";
import { Trans } from "react-i18next/TransWithoutContext";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("database.developer_export.heading"),
  };
}

export default async function ResultExportPage() {
  const { t } = await getT();

  const { data: exports, error, response } = await getExportDetails();

  if (error) return <OpenapiError response={response} t={t} />;

  if (!exports) return <Loading />;

  return (
    <Container bg="bg">
      <VStack align="left" gap="16px" as="span">
        <Heading size="5xl">{t("database.developer_export.heading")}</Heading>
        <Trans
          parent={Text}
          t={t}
          i18nKey="database.developer_export.description_html"
          values={{
            github_link:
              "<a href='https://github.com/thewca/worldcubeassociation.org/wiki/Developer-database-export'>GitHub</a>",
          }}
          components={{ a: <Link /> }}
        />
        <Link href={exports.developer_url}>
          {t("database.developer_export.download")}
        </Link>
      </VStack>
    </Container>
  );
}
