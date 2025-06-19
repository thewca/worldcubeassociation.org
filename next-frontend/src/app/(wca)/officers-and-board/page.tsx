"use client";

import _ from "lodash";
import {
  Container,
  Heading,
  Link,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import Loading from "@/components/ui/loading";
import useAPI from "@/lib/wca/useAPI";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import UserBadge from "@/components/UserBadge";
import { MdMarkEmailUnread } from "react-icons/md";
import Errored from "@/components/ui/errored";

export default function OfficersAndBoard() {
  const I18n = {
    t: (path: string) => {
      switch (path) {
        case "page.officers_and_board.title":
          return "WCA Officers & Board";
        case "page.officers_and_board.officers_description":
          return "The officers of the WCA handle tasks relating to the non-profit status of the WCA. These officers are elected by the WCA Board. The Executive Director is the Chief Executive Officer of the WCA, the Chair presides over all Board meetings, the Secretary maintains the organization's documents, and the Treasurer manages financial matters of the WCA.";
        case "user_groups.group_types.officers":
          return "WCA Officers";
        case "user_groups.group_types.board":
          return "WCA Board of Directors";
        case "page.officers_and_board.board_description":
          return "The WCA Board is responsible for leading the organization as a whole, and fulfilling any duties not fulfilled by other Teams and Committees";
        default:
          return (
            {
              "enums.user_roles.status.officers.chair": "WCA Chair",
              "enums.user_roles.status.officers.executive_director":
                "WCA Executive Director",
              "enums.user_roles.status.officers.secretary": "WCA Secretary",
              "enums.user_roles.status.officers.vice_chair": "WCA Vice-Chair",
              "enums.user_roles.status.officers.treasurer": "WCA Treasurer",
            }[path] ?? ""
          );
      }
    },
  };
  const api = useAPI();
  const { data: officerRequest, isLoading: officersLoading } = useQuery({
    queryKey: ["officers"],
    queryFn: () =>
      api.GET("/user_roles", {
        params: { query: { isActive: true, groupType: "officers" } },
      }),
  });

  const { data: boardRequest, isLoading: boardLoading } = useQuery({
    queryKey: ["board"],
    queryFn: () =>
      api.GET("/user_roles", {
        params: { query: { isActive: true, groupType: "board" } },
      }),
  });

  // The same user can hold multiple officer positions, and it won't be good to show same user
  // multiple times.
  const officerRoles = useMemo(
    () => _.groupBy(officerRequest?.data, (officer) => officer?.user?.id),
    [officerRequest],
  );
  const officers = useMemo(
    () => _.uniqBy(officerRequest?.data, "user.wca_id"),
    [officerRequest],
  );

  const board = useMemo(() => boardRequest?.data, [boardRequest]);

  if (boardLoading || officersLoading) return <Loading />;

  if (!board || !officers)
    return <Errored error={"Error Loading Officers & Board"} />;

  return (
    <Container>
      <VStack align={"left"}>
        <Heading size={"5xl"}>
          {I18n.t("page.officers_and_board.title")}
        </Heading>
        <Heading size={"2xl"}>
          {I18n.t("user_groups.group_types.officers")}
        </Heading>
        <Text>{I18n.t("page.officers_and_board.officers_description")}</Text>
        <SimpleGrid columns={3} gap="16px">
          {officers.map((officer) => (
            <UserBadge
              key={officer.id}
              profilePicture={officer.user.avatar.url}
              name={officer.user.name}
              roles={officerRoles[officer.user.id].map((role) => ({
                teamRole: I18n.t(
                  `enums.user_roles.status.officers.${role.metadata.status}`,
                ),
                staffColor: "blue",
              }))}
              wcaId={officer.user.wca_id}
            />
          ))}
        </SimpleGrid>
        <Heading size={"2xl"}>
          {I18n.t("user_groups.group_types.board")}{" "}
          <Link href={board[0].group.metadata!.email}>
            <MdMarkEmailUnread />
            {board[0].group.metadata!.email}
          </Link>
        </Heading>
        <Text>{I18n.t("page.officers_and_board.board_description")}</Text>
        <SimpleGrid columns={3} gap="16px">
          {board.map((board) => (
            <UserBadge
              key={board.id}
              profilePicture={board.user!.avatar.url}
              name={board.user!.name}
              wcaId={board.user!.wca_id}
            />
          ))}
        </SimpleGrid>
      </VStack>
    </Container>
  );
}
