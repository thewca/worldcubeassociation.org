"use client";

import useAPI from "@/lib/wca/useAPI";
import { useT } from "@/lib/i18n/useI18n";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import Loading from "@/components/ui/loading";
import {
  Container,
  Heading,
  VStack,
  Text,
  Table,
  Link,
} from "@chakra-ui/react";
import { components } from "@/types/openapi";
import I18nHTMLTranslate from "@/components/I18nHTMLTranslate";

export default function RegulationsTranslations() {
  const api = useAPI();

  const { t } = useT();

  const { data: translationRequest, isLoading } = useQuery({
    queryKey: ["regulations", "translations"],
    queryFn: () => api.GET("/regulations/translations"),
  });

  const { current, outdated } = useMemo(
    () => translationRequest?.data ?? { current: [], outdated: [] },
    [translationRequest?.data],
  );

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Container>
      <VStack align={"left"}>
        <Heading size="5xl">{t("regulations_translations.title")}</Heading>
        <Text>{t("regulations_translations.paragraph1")}</Text>
        <Text>{t("regulations_translations.paragraph2")}</Text>

        <Heading size={"2xl"}>
          {t("regulations_translations.translations")}
        </Heading>
        <Heading size={"xl"}>{t("regulations_translations.current")}</Heading>
        <TranslationList translations={current} />
        <Heading size={"xl"}>{t("regulations_translations.old")}</Heading>
        <Heading size={"2xl"}>
          {t("regulations_translations.translating")}
        </Heading>
        <TranslationList translations={outdated} />
        <I18nHTMLTranslate
          i18nKey={"regulations_translations.paragraph3_html"}
        />
      </VStack>
    </Container>
  );
}

function TranslationList({
  translations,
}: {
  translations: components["schemas"]["Translation"][];
}) {
  return (
    <Table.Root size="sm" striped>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Version</Table.ColumnHeader>
          <Table.ColumnHeader>Language</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {translations.map((item) => (
          <Table.Row key={item.version}>
            <Table.Cell>{item.version}</Table.Cell>
            <Table.Cell>
              <Link href={item.url}>{item.language}</Link> (
              {item.language_english})
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
