"use client";

import { VStack, Container, Heading, Text, Link } from "@chakra-ui/react";
import { useT } from "@/lib/i18n/useI18n";
import useAPI from "@/lib/wca/useAPI";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import Loading from "@/components/ui/loading";
import Errored from "@/components/ui/errored";
import I18nHTMLTranslate from "@/components/I18nHTMLTranslate";

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
        <Heading size={"5xl"}>{t("database.developer_export.heading")}</Heading>
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
