"use client";

import _ from "lodash";
import { Container, Heading, SimpleGrid, VStack } from "@chakra-ui/react";
import Loading from "@/components/ui/loading";
import useAPI from "@/lib/wca/useAPI";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import UserBadge from "@/components/UserBadge";
import Errored from "@/components/ui/errored";
import { useT } from "@/lib/i18n/useI18n";

export default function TranslatorsPage() {
  const I18n = useT();
  const api = useAPI();
  const { data: translatorRequest, isLoading: isLoading } = useQuery({
    queryKey: ["translators"],
    queryFn: () =>
      api.GET("/user_roles", {
        params: { query: { groupType: "translators" } },
      }),
  });

  const translatorsByLanguage = useMemo(
    () => _.groupBy(translatorRequest?.data, "group.name"),
    [translatorRequest],
  );

  if (isLoading) return <Loading />;

  if (!translatorsByLanguage)
    return <Errored error={"Error Loading Translators"} />;

  return (
    <Container>
      <VStack align={"left"}>
        <Heading size={"5xl"}>{I18n.t("page.translators.title")}</Heading>
        {_.map(translatorsByLanguage, (translators, language) => (
          <VStack align={"left"} key={language}>
            <Heading size={"2xl"}>{language}</Heading>
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
