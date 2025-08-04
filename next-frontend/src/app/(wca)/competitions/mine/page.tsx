"use client";

import { useMemo } from "react";
import { Accordion, Button, Heading, Icon } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useT } from "@/lib/i18n/useI18n";
import UpcomingCompetitionTable from "@/components/competitions/Mine/UpcomingCompetitionTable";
import PastCompetitionsTable from "@/components/competitions/Mine/PastCompetitionTable";
import { useQuery } from "@tanstack/react-query";
import useAPI from "@/lib/wca/useAPI";
import Loading from "@/components/ui/loading";

export default function MyCompetitions() {
  const { data: session } = useSession();
  const I18n = useT();
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
    <>
      <Heading>
        {session.user?.id && (
          <Button asChild>
            <a href={`/persons/${session.user.id}`}>
              {I18n.t("layouts.navigation.my_results")}
            </a>
          </Button>
        )}
        {I18n.t("competitions.my_competitions.title")}
      </Heading>
      <p>{I18n.t("competitions.my_competitions.disclaimer")}</p>
      <UpcomingCompetitionTable
        competitions={myCompetitions.future_competitions}
        fallbackMessage={{
          key: "competitions.my_competitions_table.no_upcoming_competitions_html",
          options: {
            link: `<a href="/competitions">${I18n.t("competitions.my_competitions_table.competitions_list")}</a>`,
          },
        }}
      />
      <Accordion.Root collapsible>
        <Accordion.ItemTrigger>
          <Accordion.ItemIndicator />
          {`${I18n.t("competitions.my_competitions.past_competitions")} (${myCompetitions.past_competitions?.length ?? 0})`}
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
      </Accordion.Root>
      <Heading>
        <Icon name="bookmark" />
        {I18n.t("competitions.my_competitions.bookmarked_title")}
      </Heading>
      <p>{I18n.t("competitions.my_competitions.bookmarked_explanation")}</p>
      <UpcomingCompetitionTable
        competitions={myCompetitions.bookmarked_competitions}
        fallbackMessage={{
          key: "competitions.my_competitions_table.no_bookmarked_competitions",
        }}
      />
    </>
  );
}
