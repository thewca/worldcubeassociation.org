import React from "react";
import {
  Card,
  Center,
  Flex,
  Text,
  Badge,
  Dialog,
  CloseButton,
  Portal,
  List,
  Button,
  Icon,
  DataList,
} from "@chakra-ui/react";
import { Image } from "@chakra-ui/react";
import RoleBadge, { StaffColor } from "@/components/RoleBadge";
import MyResultsIcon from "@/components/icons/MyResultsIcon";
import RegulationsHistoryIcon from "@/components/icons/RegulationsHistoryIcon";
import NationalChampionshipIcon from "@/components/icons/NationalChampionshipIcon";
import { LuStar, LuCircleHelp } from "react-icons/lu";
import countries from "@/lib/wca/data/countries";
import WcaFlag from "@/components/WcaFlag";

interface ProfileData {
  name: string;
  profilePicture: string;
  roles: { teamRole: string; teamText: string; staffColor: StaffColor }[];
  wcaId: string;
  gender: string;
  regionIso2: string;
  competitions: number;
  completedSolves: number;
}

const ProfileCard: React.FC<ProfileData> = ({
  name,
  profilePicture,
  roles,
  wcaId,
  gender,
  regionIso2,
  competitions,
  completedSolves,
}) => {
  return (
    <Card.Root
      bg="gray.subtle"
      color="white.contrast"
      h="85lvh"
      rounded="xl"
      size="sm"
      shadow="wca"
      position="sticky"
      top="20px"
    >
      <Card.Header>
        <Center>
          {/* Profile Picture */}
          <Image src={profilePicture} rounded="md" alt="Profile Photo" />
        </Center>
      </Card.Header>

      <Card.Body>
        <Card.Title marginBottom={2}>
          <Text textStyle="3xl">
            {/* TODO SLATE - country flag here */}
            {name}
          </Text>
          <Flex direction="row" wrap="wrap" align="start" gap="4px 8px">
            {roles.map((role, index) => (
              <RoleBadge
                key={index}
                teamRole={role.teamRole}
                teamText={role.teamText}
                staffColor={role.staffColor}
              />
            ))}
          </Flex>
        </Card.Title>
        <DataList.Root variant="bold">
          <DataList.Item>
            <DataList.ItemLabel>WCA ID</DataList.ItemLabel>
            <DataList.ItemValue>{wcaId}</DataList.ItemValue>
          </DataList.Item>
          {gender !== "o" && (
            <DataList.Item>
              <DataList.ItemLabel>Gender</DataList.ItemLabel>
              <DataList.ItemValue>{gender}</DataList.ItemValue>
            </DataList.Item>
          )}
          <DataList.Item>
            <DataList.ItemLabel>Region</DataList.ItemLabel>
            <DataList.ItemValue>
              <WcaFlag code={regionIso2} fallback="" height="20" width="28" />
              Representing {countries.byIso2[regionIso2].id}
            </DataList.ItemValue>
          </DataList.Item>
          <DataList.Item>
            <DataList.ItemLabel>Competitions</DataList.ItemLabel>
            <DataList.ItemValue>{competitions}</DataList.ItemValue>
          </DataList.Item>
          <DataList.Item>
            <DataList.ItemLabel>Completed Solves</DataList.ItemLabel>
            <DataList.ItemValue>{completedSolves}</DataList.ItemValue>
          </DataList.Item>
        </DataList.Root>
      </Card.Body>
      <Card.Footer>
        <Flex flexDirection="row" alignItems="flex-end">
          <Flex flexWrap="wrap">
            {" "}
            {/* TODO SLATE - fill out these badges with real info */}
            <Badge size="lg" textStyle="lg">
              <NationalChampionshipIcon />
              147 Championship Titles
            </Badge>
            <Badge size="lg" textStyle="lg">
              <Icon>
                <LuStar />
              </Icon>
              121 Time World Record Holder
            </Badge>
            <Badge size="lg" textStyle="lg">
              <RegulationsHistoryIcon />3 Year Career
            </Badge>
            <Badge size="lg" textStyle="lg">
              <MyResultsIcon />8 Gold Medals
            </Badge>
          </Flex>
          <Dialog.Root placement="center" motionPreset="slide-in-bottom">
            <Dialog.Trigger asChild>
              <Button variant="ghost" ml="auto" p="0">
                <LuCircleHelp />
              </Button>
            </Dialog.Trigger>
            <Portal>
              <Dialog.Backdrop />
              <Dialog.Positioner>
                <Dialog.Content>
                  <Dialog.Header>
                    <Dialog.Title>Profile Achievements explained</Dialog.Title>
                  </Dialog.Header>
                  <Dialog.Body>
                    <Text>
                      Competitors can unlock &apos;Achievements&apos; that get
                      displayed on their profile. These cover mainly results
                      based achievements, but not exclusively.
                    </Text>
                    <Text>
                      The badges that can be earned or displayed (right now)
                      are:
                    </Text>
                    <List.Root>
                      <List.Item>Championship Podiums</List.Item>
                      <List.Item>Records</List.Item>
                      <List.Item>Career Length</List.Item>
                      <List.Item>Medals won</List.Item>
                    </List.Root>
                  </Dialog.Body>
                  <Dialog.CloseTrigger asChild>
                    <CloseButton size="sm" />
                  </Dialog.CloseTrigger>
                </Dialog.Content>
              </Dialog.Positioner>
            </Portal>
          </Dialog.Root>
        </Flex>
      </Card.Footer>
    </Card.Root>
  );
};

export default ProfileCard;
