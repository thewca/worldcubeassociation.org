"use client";

import { useMemo, useState } from "react";
import { Accordion, Button, Heading, Icon } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useT } from "@/lib/i18n/useI18n";
import UpcomingCompetitionTable from "@/components/competitions/Mine/UpcomingCompetitionTable";
import PastCompetitionsTable from "@/components/competitions/Mine/PastCompetitionTable";
import { useQuery } from "@tanstack/react-query";
import useAPI from "@/lib/wca/useAPI";
import Loading from "@/components/ui/loading";

export default function MyCompetitions() {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const { data: session } = useSession();
  const I18n = useT();
  const api = useAPI();

  const { data: myCompetitionsRequest, isLoading } = useQuery({
    queryKey: ["my-competitions"],
    queryFn: () => api.GET("/competitions/mine", {}),
  });

  const myCompetitions = useMemo(
    () => myCompetitionsRequest?.data,
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
        competitions={myCompetitions.futureCompetitions}
        fallbackMessage={{
          key: "competitions.my_competitions_table.no_upcoming_competitions_html",
          options: {
            link: `<a href="${competitionsUrl({})}">${I18n.t("competitions.my_competitions_table.competitions_list")}</a>`,
          },
        }}
      />
      <Accordion fluid styled>
        <Accordion.Title
          active={isAccordionOpen}
          onClick={() => setIsAccordionOpen((prevValue) => !prevValue)}
        >
          {`${I18n.t("competitions.my_competitions.past_competitions")} (${competitions.pastCompetitions?.length ?? 0})`}
        </Accordion.Title>
        <Accordion.Content active={isAccordionOpen}>
          <PastCompetitionsTable
            competitions={myCompetitions.pastCompetitions}
            fallbackMessage={{
              key: "competitions.my_competitions_table.no_past_competitions",
            }}
          />
        </Accordion.Content>
      </Accordion>
      <Heading>
        <Icon name="bookmark" />
        {I18n.t("competitions.my_competitions.bookmarked_title")}
      </Heading>
      <p>{I18n.t("competitions.my_competitions.bookmarked_explanation")}</p>
      <UpcomingCompetitionTable
        competitions={myCompetitions.bookmarkedCompetitions}
        fallbackMessage={{
          key: "competitions.my_competitions_table.no_bookmarked_competitions",
        }}
      />
    </>
  );
}
