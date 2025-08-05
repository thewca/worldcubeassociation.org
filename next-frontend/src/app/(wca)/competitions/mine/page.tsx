"use client";

import { useMemo } from "react";
import {
  Accordion,
  Button,
  Container,
  Heading,
  VStack,
} from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useT } from "@/lib/i18n/useI18n";
import UpcomingCompetitionTable from "@/components/competitions/Mine/UpcomingCompetitionTable";
import PastCompetitionsTable from "@/components/competitions/Mine/PastCompetitionTable";
import { useQuery } from "@tanstack/react-query";
import useAPI from "@/lib/wca/useAPI";
import Loading from "@/components/ui/loading";
import BookmarkIcon from "@/components/icons/BookmarkIcon";

export default function MyCompetitions() {
  const { data: session } = useSession();
  const { t } = useT();
  const api = useAPI();

  const { data: myCompetitionsRequest, isLoading } = useQuery({
    queryKey: ["my-competitions"],
    queryFn: () => api.GET("/competitions/mine", {}),
  });

  const myCompetitions = useMemo(
    () =>
      myCompetitionsRequest?.data ?? {
        future_competitions: [],
        past_competitions: [],
        bookmarked_competitions: [],
      },
    [myCompetitionsRequest],
  );

  if (isLoading) {
    return <Loading />;
  }

  if (!session) {
    return <p>Please Log in</p>;
  }

  return (
    <Container bg={"bg"}>
      <VStack gap="8" pt="8" alignItems="left">
        <Heading size={"5xl"}>
          {session.user?.id && (
            <Button asChild>
              <a href={`/persons/${session.user.id}`}>
                {t("layouts.navigation.my_results")}
              </a>
            </Button>
          )}
          {t("competitions.my_competitions.title")}
        </Heading>
        <p>{t("competitions.my_competitions.disclaimer")}</p>
        <UpcomingCompetitionTable
          competitions={myCompetitions.future_competitions}
          fallbackMessage={{
            key: "competitions.my_competitions_table.no_upcoming_competitions_html",
            options: {
              link: `<a href="/competitions">${t("competitions.my_competitions_table.competitions_list")}</a>`,
            },
          }}
        />
        <Accordion.Root collapsible>
          <Accordion.Item value={"past_competitions"}>
            <Accordion.ItemTrigger>
              <Accordion.ItemIndicator />
              {`${t("competitions.my_competitions.past_competitions")} (${myCompetitions.past_competitions?.length ?? 0})`}
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Accordion.ItemBody>
                <PastCompetitionsTable
                  competitions={myCompetitions.past_competitions}
                  fallbackMessage={{
                    key: "competitions.my_competitions_table.no_past_competitions",
                  }}
                />
              </Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>
        </Accordion.Root>
        <Heading>
          <BookmarkIcon />
          {t("competitions.my_competitions.bookmarked_title")}
        </Heading>
        <p>{t("competitions.my_competitions.bookmarked_explanation")}</p>
        <UpcomingCompetitionTable
          competitions={myCompetitions.bookmarked_competitions}
          fallbackMessage={{
            key: "competitions.my_competitions_table.no_bookmarked_competitions",
          }}
        />
      </VStack>
    </Container>
  );
}
