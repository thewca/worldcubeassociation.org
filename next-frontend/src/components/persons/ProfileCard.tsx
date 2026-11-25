import React from "react";
import {
  Card,
  Center,
  Flex,
  Text,
  Dialog,
  CloseButton,
  Portal,
  List,
  IconButton,
  Icon,
  DataList,
  SimpleGrid,
  HStack,
  Stat,
  Badge,
  StatGroup,
} from "@chakra-ui/react";
import { Image } from "@chakra-ui/react";
import RoleBadge, { StaffColor } from "@/components/RoleBadge";
import MyResultsIcon from "@/components/icons/MyResultsIcon";
import RegulationsHistoryIcon from "@/components/icons/RegulationsHistoryIcon";
import NationalChampionshipIcon from "@/components/icons/NationalChampionshipIcon";
import { LuStar, LuCircleHelp, LuPencil } from "react-icons/lu";
import WcaFlag from "@/components/WcaFlag";
import CountryMap from "@/components/CountryMap";
import { getT } from "@/lib/i18n/get18n";
import RailsLink from "@/components/RailsLink";
import getPermissions from "@/lib/wca/permissions.server";

interface ProfileData {
  name: string;
  profilePicture: string;
  roles: { teamRole: string; teamText: string; staffColor: StaffColor }[];
  wcaId: string;
  userId: number | null;
  gender?: string;
  regionIso2: string;
  competitions: number;
  completedSolves: number;
  medalCount: number;
  recordCount: number;
  championshipPodiumCount: number;
}

const ProfileCard: React.FC<ProfileData> = async ({
  name,
  profilePicture,
  roles,
  wcaId,
  userId,
  gender,
  regionIso2,
  competitions,
  completedSolves,
  medalCount,
  recordCount,
  championshipPodiumCount,
}) => {
  const startYear = Number.parseInt(wcaId.slice(0, 4));
  const currentYear = new Date().getFullYear();
  const careerYears = currentYear - startYear;

  const { t } = await getT();
  const permissions = await getPermissions();

  // There is still plenty of users who don't have an account so they don't have a userId
  const canEditUser =
    userId !== null && Boolean(permissions?.canEditUser(userId.toString()));

  return (
    <Card.Root size="sm" position={{ base: "static", lg: "sticky" }} top={4}>
      <Card.Header>
        <Center>
          <Image
            src={profilePicture}
            rounded="md"
            alt={t("common.user.profile_picture")}
            minW={0}
            maxW="full"
            maxH={{ base: "3xs", md: "xs" }}
          />
        </Center>
      </Card.Header>

      <Card.Body>
        <Card.Title>
          <HStack>
            <WcaFlag code={regionIso2} size="2xl" />
            <Text textStyle="h2">{name}</Text>
            {canEditUser && (
              <IconButton
                asChild
                variant="ghost"
                size="sm"
                aria-label={t("layouts.navigation.edit_profile")}
              >
                <RailsLink href={`/users/${userId}/edit`}>
                  <LuPencil />
                </RailsLink>
              </IconButton>
            )}
          </HStack>
          <Flex direction="row" wrap="wrap" align="start" gap="4px 8px">
            {roles.map((role, index) => (
              <RoleBadge
                key={index}
                teamRole={role.teamRole}
                teamText={role.teamText}
                colorPalette={role.staffColor}
              />
            ))}
          </Flex>
        </Card.Title>
        <SimpleGrid columns={2}>
          <DataList.Root variant="bold">
            <DataList.Item>
              <DataList.ItemLabel>{t("common.user.wca_id")}</DataList.ItemLabel>
              <DataList.ItemValue>{wcaId}</DataList.ItemValue>
            </DataList.Item>
            {gender !== "o" && (
              <DataList.Item>
                <DataList.ItemLabel>
                  {t("activerecord.attributes.user.gender")}
                </DataList.ItemLabel>
                <DataList.ItemValue>
                  {t(`enums.user.gender.${gender}`)}
                </DataList.ItemValue>
              </DataList.Item>
            )}
            <DataList.Item>
              <DataList.ItemLabel>
                {t("persons.show.completed_solves")}
              </DataList.ItemLabel>
              <DataList.ItemValue>{completedSolves}</DataList.ItemValue>
            </DataList.Item>
          </DataList.Root>
          <DataList.Root variant="bold">
            <DataList.Item>
              <DataList.ItemLabel>{t("common.country")}</DataList.ItemLabel>
              <DataList.ItemValue>
                <CountryMap code={regionIso2} t={t} />
              </DataList.ItemValue>
            </DataList.Item>
            <DataList.Item>
              <DataList.ItemLabel>
                {t("layouts.navigation.competitions")}
              </DataList.ItemLabel>
              <DataList.ItemValue>{competitions}</DataList.ItemValue>
            </DataList.Item>
          </DataList.Root>
        </SimpleGrid>
      </Card.Body>
      <Card.Body>
        <Card.Title>
          <HStack justify="space-between">
            <Text textStyle="s4">{t("persons.show.achievements.title")}</Text>
            <Dialog.Root placement="center" motionPreset="slide-in-bottom">
              <Dialog.Trigger asChild>
                <IconButton variant="ghost">
                  <LuCircleHelp />
                </IconButton>
              </Dialog.Trigger>
              <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                  <Dialog.Content>
                    <Dialog.Header>
                      <Dialog.Title>
                        {t("persons.show.achievements.explanation_title")}
                      </Dialog.Title>
                    </Dialog.Header>
                    <Dialog.Body>
                      <Text>{t("persons.show.achievements.explanation")}</Text>
                      <Text>{t("persons.show.achievements.badges_intro")}</Text>
                      <List.Root>
                        <List.Item>
                          {t("persons.show.championship_podiums")}
                        </List.Item>
                        <List.Item>{t("persons.show.records")}</List.Item>
                        <List.Item>
                          {t("persons.show.achievements.career_length")}
                        </List.Item>
                        <List.Item>
                          {t("persons.show.achievements.medals_won")}
                        </List.Item>
                      </List.Root>
                    </Dialog.Body>
                    <Dialog.CloseTrigger asChild>
                      <CloseButton size="sm" />
                    </Dialog.CloseTrigger>
                  </Dialog.Content>
                </Dialog.Positioner>
              </Portal>
            </Dialog.Root>
          </HStack>
        </Card.Title>
        <StatGroup gapY={2}>
          {championshipPodiumCount > 0 && (
            <Badge variant="achievement">
              <NationalChampionshipIcon />
              <Stat.Root>
                <Stat.Label>
                  {t("persons.show.championship_podiums")}
                </Stat.Label>
                <Stat.ValueText>{championshipPodiumCount}</Stat.ValueText>
              </Stat.Root>
            </Badge>
          )}
          {recordCount > 0 && (
            <Badge variant="achievement">
              <Icon asChild>
                <LuStar />
              </Icon>
              <Stat.Root>
                <Stat.Label>{t("persons.show.records")}</Stat.Label>
                <Stat.ValueText>{recordCount}</Stat.ValueText>
              </Stat.Root>
            </Badge>
          )}
          {startYear !== currentYear && (
            <Badge variant="achievement">
              <RegulationsHistoryIcon />
              <Stat.Root>
                <Stat.Label>{t("persons.show.achievements.career")}</Stat.Label>
                <Stat.ValueText>
                  {careerYears}
                  <Stat.ValueUnit>
                    {t("persons.show.achievements.years", {
                      count: careerYears,
                    })}
                  </Stat.ValueUnit>
                </Stat.ValueText>
              </Stat.Root>
            </Badge>
          )}
          {medalCount > 0 && (
            <Badge variant="achievement">
              <MyResultsIcon />
              <Stat.Root>
                <Stat.Label>{t("persons.show.achievements.medals")}</Stat.Label>
                <Stat.ValueText>{medalCount}</Stat.ValueText>
              </Stat.Root>
            </Badge>
          )}
        </StatGroup>
      </Card.Body>
    </Card.Root>
  );
};

export default ProfileCard;
