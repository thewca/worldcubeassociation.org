import {
  VStack,
  Container,
  Heading,
  Text,
  Card,
  Code,
  Link,
} from "@chakra-ui/react";
import { getT } from "@/lib/i18n/get18n";
import { getExportDetails } from "@/lib/wca/exports/getExportDetails";
import Errored from "@/components/ui/errored";
import Loading from "@/components/ui/loading";

export default async function ResultExportPage() {
  const { t } = await getT();

  const { data: exportRequest, error } = await getExportDetails();

  if (error) return <Errored error={error} />;

  if (!exportRequest) return <Loading />;

  return (
    <Container>
      <VStack align={"left"} gap={"16px"}>
        <Heading size={"5xl"}>{t("database.results_export.heading")}</Heading>
        <Text>{t("database.results_export.description")}</Text>
        <Card.Root>
          <Card.Body>
            <Card.Title>SQL</Card.Title>
            <Card.Description>
              <VStack align={"left"}>
                <Text>{t("database.results_export.file_formats.sql")}</Text>
                <Link href={exports.sql_url}>
                  {exports.sql_url} ({exports.export_date})
                </Link>
              </VStack>
            </Card.Description>
          </Card.Body>
        </Card.Root>
        <Card.Root>
          <Card.Body>
            <Card.Title>TSV</Card.Title>
            <Card.Description>
              <VStack align={"left"}>
                {t("database.results_export.file_formats.tsv")}
                <Link href={exports.tsv_url}>
                  {exports.tsv_url} ({exports.export_date})
                </Link>
              </VStack>
            </Card.Description>
          </Card.Body>
        </Card.Root>
        <Text>
          {t("database.results_export.hint_readme_html", {
            readme_filename: "README.md",
          })}
        </Text>
        <Code display="block" whiteSpace="pre" fontSize="sm">
          {exports.readme}
        </Code>
      </VStack>
    </Container>
  );
}
