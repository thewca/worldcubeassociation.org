"use client";

import {
  VStack,
  Container,
  Heading,
  Text,
  Card,
  Code,
  Link,
} from "@chakra-ui/react";
import { useT } from "@/lib/i18n/useI18n";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Errored from "@/components/ui/errored";
import Loading from "@/components/ui/loading";
import useAPI from "@/lib/wca/useAPI";

export default function ResultExportPage() {
  const { t } = useT();
  const api = useAPI();
  const { data: exportRequest, isLoading } = useQuery({
    queryKey: ["exports"],
    queryFn: () => api.GET("/export/public"),
  });

  const exports = useMemo(() => exportRequest?.data, [exportRequest]);

  if (isLoading) return <Loading />;

  if (!exports) return <Errored error={"Error Loading Exports"} />;

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
                <Link>
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
                <Link>
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
        <Code display={"block"} whiteSpace="pre" fontSize={"sm"}>
          <Link>{exports.readme}</Link>
        </Code>
      </VStack>
    </Container>
  );
}
