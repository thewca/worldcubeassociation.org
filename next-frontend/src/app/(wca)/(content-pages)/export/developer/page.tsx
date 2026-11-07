import { Heading, Link, Text, VStack } from "@chakra-ui/react";
import { getT } from "@/lib/i18n/get18n";
import { getExportDetails } from "@/lib/wca/exports/getExportDetails";
import Loading from "@/components/ui/loading";
import OpenapiError from "@/components/ui/openapiError";
import TransWithLinks from "@/components/TransWithLinks";
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
    <VStack align="left" gap="16px" as="span">
      <Heading size="5xl">{t("database.developer_export.heading")}</Heading>
      <Text>
        <TransWithLinks
          i18nKey="database.developer_export.description_html"
          values={{
            github_link:
              "<a href='https://github.com/thewca/worldcubeassociation.org/wiki/Developer-database-export'>GitHub</a>",
          }}
        />
      </Text>
      <Link href={exports.developer_url}>
        {t("database.developer_export.download")}
      </Link>
    </VStack>
  );
}
