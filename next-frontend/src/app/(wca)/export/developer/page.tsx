import { VStack, Container, Heading, Text, Link } from "@chakra-ui/react";
import { getT } from "@/lib/i18n/get18n";
import { getExportDetails } from "@/lib/wca/exports/getExportDetails";
import Loading from "@/components/ui/loading";
import Errored from "@/components/ui/errored";
import I18nHTMLTranslate from "@/components/I18nHTMLTranslate";

export default async function ResultExportPage() {
  const { t } = await getT();

  const { data: exports, error } = await getExportDetails();

  if (error) return <Errored error={error} />;

  if (!exports) return <Loading />;

  return (
    <Container>
      <VStack align="left" gap="16px">
        <Heading size="5xl">{t("database.developer_export.heading")}</Heading>
        <Text>
          <I18nHTMLTranslate
            i18nKey={"database.developer_export.description_html"}
            options={{
              github_link:
                "<a href='https://github.com/thewca/worldcubeassociation.org/wiki/Developer-database-export'>GitHub</a>",
            }}
          />
        </Text>
        <Link href={exports.developer_url}>
          {t("database.developer_export.download")}
        </Link>
      </VStack>
    </Container>
  );
}
