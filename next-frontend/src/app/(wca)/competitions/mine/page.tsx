import {
  Accordion,
  Button,
  Container,
  Heading,
  VStack,
} from "@chakra-ui/react";
import { auth } from "@/auth";
import { getT } from "@/lib/i18n/get18n";
import UpcomingCompetitionTable from "@/components/competitions/Mine/UpcomingCompetitionTable";
import PastCompetitionsTable from "@/components/competitions/Mine/PastCompetitionTable";
import { serverClientWithToken } from "@/lib/wca/wcaAPI";
import BookmarkIcon from "@/components/icons/BookmarkIcon";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("competitions.my_competitions.title"),
  };
}

export default async function MyCompetitions() {
  const session = await auth();
  const { t } = await getT();

  if (!session) {
    return <p>Please Log in</p>;
  }

  // @ts-expect-error TODO: Fix this
  const client = serverClientWithToken(session.accessToken);

  const myCompetitionsRequest = await client.GET("/v0/competitions/mine");

  if (myCompetitionsRequest.error) {
    return <p>Something went wrong while fetching your competitions</p>;
  }

  const myCompetitions = myCompetitionsRequest.data;

  return (
    <Container bg="bg">
      <VStack gap="8" pt="8" alignItems="left">
        <Heading size="5xl">
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
          registrationStatusByCompetition={
            myCompetitions.registrations_by_competition
          }
          fallbackMessage={{
            key: "competitions.my_competitions_table.no_upcoming_competitions_html",
            options: {
              link: `<a href="/competitions">${t("competitions.my_competitions_table.competitions_list")}</a>`,
            },
          }}
        />
        <Accordion.Root collapsible>
          <Accordion.Item value="past_competitions">
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
          <BookmarkIcon /> {t("competitions.my_competitions.bookmarked_title")}
        </Heading>
        <p>{t("competitions.my_competitions.bookmarked_explanation")}</p>
        <UpcomingCompetitionTable
          competitions={myCompetitions.bookmarked_competitions}
          registrationStatusByCompetition={
            myCompetitions.registrations_by_competition
          }
          fallbackMessage={{
            key: "competitions.my_competitions_table.no_bookmarked_competitions",
          }}
        />
      </VStack>
    </Container>
  );
}
