import _ from "lodash";
import { Container, Heading, SimpleGrid, VStack } from "@chakra-ui/react";
import UserBadge from "@/components/UserBadge";
import Errored from "@/components/ui/errored";
import { getT } from "@/lib/i18n/get18n";
import { getTranslatorRoles } from "@/lib/wca/roles/activeRoles";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("page.translators.title"),
  };
}
export default async function TranslatorsPage() {
  const { t } = await getT();

  const { data: translatorRoles, error, response } = await getTranslatorRoles();

  if (error) return <Errored response={response} t={t} />;

  const translatorsByLanguage = _.groupBy(translatorRoles, "group.name");

  return (
    <Container bg="bg">
      <VStack align="left">
        <Heading size="5xl">{t("page.translators.title")}</Heading>
        {_.map(translatorsByLanguage, (translators, language) => (
          <VStack align="left" key={language}>
            <Heading size="2xl" marginY={2}>
              {language}
            </Heading>
            <SimpleGrid columns={3} gap="16px">
              {translators.map((translator) => (
                <UserBadge
                  key={translator.id}
                  profilePicture={translator.user.avatar}
                  name={translator.user.name}
                  wcaId={translator.user.wca_id}
                />
              ))}
            </SimpleGrid>
          </VStack>
        ))}
      </VStack>
    </Container>
  );
}
