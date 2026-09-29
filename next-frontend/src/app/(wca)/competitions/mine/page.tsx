import { Accordion, Button, Heading, Stack, VStack } from "@chakra-ui/react";
import { getSession } from "@/auth";
import { getT } from "@/lib/i18n/get18n";
import UpcomingCompetitionTable from "@/components/competitions/Mine/UpcomingCompetitionTable";
import PastCompetitionsTable from "@/components/competitions/Mine/PastCompetitionTable";
import { serverClientWithToken } from "@/lib/wca/wcaAPI";
import BookmarkIcon from "@/components/icons/BookmarkIcon";
import { Metadata } from "next";
import Link from "next/link";
import { route } from "nextjs-routes";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("competitions.my_competitions.title"),
  };
}

export default async function MyCompetitions() {
  const session = await getSession();
  const { t } = await getT();

  if (!session) {
    return <p>Please Log in</p>;
  }

  const client = serverClientWithToken(session.accessToken);

  const myCompetitionsRequest = await client.GET("/v0/competitions/mine");

  if (myCompetitionsRequest.error) {
    return <p>Something went wrong while fetching your competitions</p>;
  }

  const myCompetitions = myCompetitionsRequest.data;

  return (
    <VStack gap="8" alignItems="left">
      <Stack
        direction={{ base: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ base: "flex-start", md: "center" }}
        gap="4"
      >
        <Heading size="5xl">{t("competitions.my_competitions.title")}</Heading>
        {session.user?.wcaId && (
          <Button asChild>
            <Link
              href={route({
                pathname: "/persons/[wcaId]",
                query: { wcaId: session.user.wcaId },
              })}
            >
              {t("layouts.navigation.my_results")}
            </Link>
          </Button>
        )}
      </Stack>
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
  );
}
