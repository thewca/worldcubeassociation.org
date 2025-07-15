import _ from "lodash";
import { Container, Heading, SimpleGrid, VStack } from "@chakra-ui/react";
import UserBadge from "@/components/UserBadge";
import Errored from "@/components/ui/errored";
import { getT } from "@/lib/i18n/get18n";
import { getTranslatorRoles } from "@/lib/wca/roles/activeRoles";

export default async function TranslatorsPage() {
  const { t } = await getT();

  const { data: translatorRoles, error } = await getTranslatorRoles();

  if (error) return <Errored error={error} />;

  const translatorsByLanguage = _.groupBy(translatorRoles, "group.name");

  if (!translatorsByLanguage)
    return <Errored error={"Error Loading Translators"} />;

  return (
    <Container>
      <VStack align={"left"}>
        <Heading size={"5xl"}>{t("page.translators.title")}</Heading>
        {_.map(translatorsByLanguage, (translators, language) => (
          <VStack align={"left"} key={language}>
            <Heading size={"2xl"} marginY={2}>
              {language}
            </Heading>
            <SimpleGrid columns={3} gap="16px">
              {translators.map((translator) => (
                <UserBadge
                  key={translator.id}
                  profilePicture={translator.user.avatar.url}
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
