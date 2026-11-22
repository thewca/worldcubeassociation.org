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

            // eslint-disable-next-line no-restricted-syntax -- Existing text added before we started enforcing translations
            alt="Profile Photo"
            minW={0}
            maxW={{ base: "3xs", md: "sm" }}
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
              <DataList.ItemLabel>
                {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
                WCA ID
              </DataList.ItemLabel>
              <DataList.ItemValue>{wcaId}</DataList.ItemValue>
            </DataList.Item>
            {gender !== "o" && (
              <DataList.Item>
                <DataList.ItemLabel>
                  {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
                  Gender
                </DataList.ItemLabel>
                <DataList.ItemValue>
                  {t(`enums.user.gender.${gender}`)}
                </DataList.ItemValue>
              </DataList.Item>
            )}
            <DataList.Item>
              <DataList.ItemLabel>
                {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
                Completed Solves
              </DataList.ItemLabel>
              <DataList.ItemValue>{completedSolves}</DataList.ItemValue>
            </DataList.Item>
          </DataList.Root>
          <DataList.Root variant="bold">
            <DataList.Item>
              <DataList.ItemLabel>
                {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
                Region
              </DataList.ItemLabel>
              <DataList.ItemValue>
                <CountryMap code={regionIso2} t={t} />
              </DataList.ItemValue>
            </DataList.Item>
            <DataList.Item>
              <DataList.ItemLabel>
                {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
                Competitions
              </DataList.ItemLabel>
              <DataList.ItemValue>{competitions}</DataList.ItemValue>
            </DataList.Item>
          </DataList.Root>
        </SimpleGrid>
      </Card.Body>
      <Card.Body>
        <Card.Title>
          <HStack justify="space-between">
            <Text textStyle="s4">
              {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
              Achievements
            </Text>
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
                        {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
                        Profile Achievements explained
                      </Dialog.Title>
                    </Dialog.Header>
                    <Dialog.Body>
                      <Text>
                        {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
                        Competitors can unlock &apos;Achievements&apos; that get
                        displayed on their profile. These cover mainly results
                        based achievements, but not exclusively.
                      </Text>
                      <Text>
                        {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
                        The badges that can be earned or displayed (right now)
                        are:
                      </Text>
                      <List.Root>
                        <List.Item>
                          {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
                          Championship Podiums
                        </List.Item>
                        <List.Item>
                          {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
                          Records
                        </List.Item>
                        <List.Item>
                          {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
                          Career Length
                        </List.Item>
                        <List.Item>
                          {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
                          Medals won
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
                  {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
                  Championship Podiums
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
                <Stat.Label>
                  {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
                  Records
                </Stat.Label>
                <Stat.ValueText>{recordCount}</Stat.ValueText>
              </Stat.Root>
            </Badge>
          )}
          {startYear !== currentYear && (
            <Badge variant="achievement">
              <RegulationsHistoryIcon />
              <Stat.Root>
                <Stat.Label>
                  {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
                  Career
                </Stat.Label>
                <Stat.ValueText>
                  {currentYear - startYear}
                  <Stat.ValueUnit>
                    {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
                    Years
                  </Stat.ValueUnit>
                </Stat.ValueText>
              </Stat.Root>
            </Badge>
          )}
          {medalCount > 0 && (
            <Badge variant="achievement">
              <MyResultsIcon />
              <Stat.Root>
                <Stat.Label>
                  {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
                  Medals
                </Stat.Label>
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
