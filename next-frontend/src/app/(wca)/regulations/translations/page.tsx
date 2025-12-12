import { getT } from "@/lib/i18n/get18n";
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
import { getRegulationsTranslations } from "@/lib/wca/regulations/getRegulationsTranslations";
import Errored from "@/components/ui/errored";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("regulations_translations.title"),
  };
}

export default async function RegulationsTranslations() {
  const { t } = await getT();

  const { data: translationRequest, error } =
    await getRegulationsTranslations();

  if (error) return <Errored error={error} />;

  const { current, outdated } = translationRequest;

  return (
    <Container bg="bg">
      <VStack align="left">
        <Heading size="5xl">{t("regulations_translations.title")}</Heading>
        <Text>{t("regulations_translations.paragraph1")}</Text>
        <Text>{t("regulations_translations.paragraph2")}</Text>

        <Heading size="2xl">
          {t("regulations_translations.translations")}
        </Heading>
        <Heading size="xl">{t("regulations_translations.current")}</Heading>
        <TranslationList translations={current} />
        <Heading size="xl">{t("regulations_translations.old")}</Heading>
        <Heading size="2xl">
          {t("regulations_translations.translating")}
        </Heading>
        <TranslationList translations={outdated} />
        <I18nHTMLTranslate i18nKey="regulations_translations.paragraph3_html" />
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
