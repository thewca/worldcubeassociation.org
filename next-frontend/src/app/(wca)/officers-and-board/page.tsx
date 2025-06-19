"use client";

import _ from "lodash";
import { Container, Heading } from "@chakra-ui/react";
import Loading from "@/components/ui/loading";
import useAPI from "@/lib/wca/useAPI";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import ProfileCard from "@/components/persons/ProfileCard";

export default function OfficersAndBoard() {
  const I18n = { t: (path: string) => path };
  const api = useAPI();
  const { data: officerRequest, isLoading: officersLoading } = useQuery({
    queryKey: ["officers"],
    queryFn: () =>
      api.GET("/user_roles", {
        params: { query: { isActive: true, groupTypes: "officers" } },
      }),
  });

  const { data: boardRequest, isLoading: boardLoading } = useQuery({
    queryKey: ["board"],
    queryFn: () =>
      api.GET("/user_roles", {
        params: { query: { isActive: true, groupTypes: "board" } },
      }),
  });

  // The same user can hold multiple officer positions, and it won't be good to show same user
  // multiple times.
  const officerRoles = useMemo(
    () => _.groupBy(officerRequest?.data, (officer) => officer?.user?.id),
    [officerRequest],
  );
  const officers = useMemo(
    () => _.uniq(officerRequest?.data, "user.id"),
    [officerRequest],
  );

  if (boardLoading || officersLoading) return <Loading />;

  return (
    <Container>
      <Heading size={"5xl"}>{I18n.t("page.officers_and_board.title")}</Heading>
      <Heading size={"2xl"}>
        {I18n.t("user_groups.group_types.officers")}
      </Heading>
      <p>{I18n.t("page.officers_and_board.officers_description")}</p>
      {officers.map((officer) => (
        <ProfileCard
          key={officer.id}
          profilePicture={officer.user!.avatar.url}
          name={officer.user!.name}
          roles={officerRoles[officer.user!.id].map((role) => ({
            teamRole: role.group!.name!,
            teamText: role.group!.name!,
            staffColor: "blue",
          }))}
          gender={officer.user!.gender!}
          wcaId={officer.user!.wca_id}
          regionIso2={officer.user!.country_iso2}
          competitions={0}
          completedSolves={0}
        />
      ))}
      {/*<Heading size={"2xl"}>*/}
      {/*  <span>{I18n.t("user_groups.group_types.board")}</span>{" "}*/}
      {/*  <EmailButton email={board[0].group.metadata.email} />*/}
      {/*</Heading>*/}
      {/*<p>{I18n.t("page.officers_and_board.board_description")}</p>*/}
      {/*{boardRequest?.data.map((boardRole) => (*/}
      {/*  <UserBadge key={boardRole.user.id} user={boardRole.user} size="large" />*/}
      {/*))}*/}
    </Container>
  );
}
