import _ from "lodash";
import {
  Container,
  Heading,
  Link,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import UserBadge from "@/components/UserBadge";
import { MdMarkEmailUnread } from "react-icons/md";
import Errored from "@/components/ui/errored";
import { getT } from "@/lib/i18n/get18n";
import { getBoardRoles, getOfficersRoles } from "@/lib/wca/roles/activeRoles";

export default async function OfficersAndBoard() {
  const { t } = await getT();

  const { data: officerRoles, error: officerRolesError } =
    await getOfficersRoles();

  const { data: boardRoles, error: boardRolesError } = await getBoardRoles();

  if (officerRolesError) return <Errored error={officerRolesError} />;
  if (boardRolesError) return <Errored error={boardRolesError} />;

  // The same user can hold multiple officer positions, and it won't be good to show same user
  // multiple times.
  const groupedOfficerRoles = _.groupBy(
    officerRoles,
    (officer) => officer.user.id,
  );

  const officers = _.uniqBy(officerRoles, "user.wca_id");

  return (
    <Container>
      <VStack align={"left"}>
        <Heading size={"5xl"}>{t("page.officers_and_board.title")}</Heading>
        <Heading size={"2xl"}>{t("user_groups.group_types.officers")}</Heading>
        <Text>{t("page.officers_and_board.officers_description")}</Text>
        <SimpleGrid columns={3} gap="16px">
          {officers.map((officer) => (
            <UserBadge
              key={officer.id}
              profilePicture={officer.user.avatar.url}
              name={officer.user.name}
              roles={groupedOfficerRoles[officer.user.id].map((role) => ({
                teamRole: t(
                  `enums.user_roles.status.officers.${role.metadata.status}`,
                ),
                staffColor: "blue",
              }))}
              wcaId={officer.user.wca_id}
            />
          ))}
        </SimpleGrid>
        <Heading size={"2xl"}>
          {t("user_groups.group_types.board")}{" "}
          <Link href={boardRoles[0].group.metadata!.email}>
            <MdMarkEmailUnread />
            {boardRoles[0].group.metadata!.email}
          </Link>
        </Heading>
        <Text>{t("page.officers_and_board.board_description")}</Text>
        <SimpleGrid columns={3} gap="16px">
          {boardRoles.map((board) => (
            <UserBadge
              key={board.id}
              profilePicture={board.user.avatar.url}
              name={board.user.name}
              wcaId={board.user.wca_id}
            />
          ))}
        </SimpleGrid>
      </VStack>
    </Container>
  );
}
