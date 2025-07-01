import {
  VStack,
  Container,
  Heading,
  Text,
  Card,
  Code,
  Link,
  Button,
  HStack,
  Badge,
} from "@chakra-ui/react";
import { getT } from "@/lib/i18n/get18n";
import { getExportDetails } from "@/lib/wca/exports/getExportDetails";
import Errored from "@/components/ui/errored";
import Loading from "@/components/ui/loading";

export default async function ResultExportPage() {
  const { t } = await getT();

  const { data: exports, error } = await getExportDetails();

  if (error) return <Errored error={error} />;

  if (!exports) return <Loading />;

  return (
    <Container>
      <VStack align="left" gap="16px">
        <Heading size="5xl">{t("database.results_export.heading")}</Heading>
        <Text>{t("database.results_export.description")}</Text>
        <ExportCard
          type="sql"
          url={exports.sql_url}
          export_date={exports.export_date}
        />
        <ExportCard
          type="tsv"
          url={exports.tsv_url}
          export_date={exports.export_date}
        />
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

const ExportCard = async ({
  type,
  url,
  export_date,
}: {
  type: "sql" | "tsv";
  url: string;
  export_date: string;
}) => {
  const { t } = await getT();

  return (
    <Card.Root>
      <Card.Body>
        <Card.Title>{type.toUpperCase()}</Card.Title>
        <Card.Description>
          {t(`database.results_export.file_formats.${type}`)}
        </Card.Description>
        <HStack mt="2">
          <Badge>{export_date}</Badge>
          <Badge>Filesize</Badge>
        </HStack>
      </Card.Body>
      <Card.Footer>
        <Button asChild>
          <Link href={url}>{t("database.developer_export.download")}</Link>
        </Button>
      </Card.Footer>
    </Card.Root>
  );
};
