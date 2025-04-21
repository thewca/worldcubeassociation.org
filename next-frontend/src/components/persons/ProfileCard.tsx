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
} from "@chakra-ui/react";
import { Image } from "@chakra-ui/react";
import { DataListItem, DataListRoot } from "@/components/ui/data-list";
import RoleBadge from "@/components/RoleBadge";
import MyResultsIcon from "@/components/icons/MyResultsIcon";
import RegulationsHistoryIcon from "@/components/icons/RegulationsHistoryIcon";
import NationalChampionshipIcon from "@/components/icons/NationalChampionshipIcon";
import { LuStar } from "react-icons/lu";
import { LuCircleHelp } from "react-icons/lu";

interface ProfileData {
  name: string;
  profilePicture: string;
  roles: { teamRole: string; teamText: string; staffColor: string }[];
  wcaId: string;
  gender: string;
  region: string;
  competitions: number;
  completedSolves: number;
}

const ProfileCard: React.FC<ProfileData> = ({
  name,
  profilePicture,
  roles,
  wcaId,
  gender,
  region,
  competitions,
  completedSolves,
}) => {
  return (
    <Card.Root
      bg="grey.solid"
      color="wcawhite.contrast"
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
          <Image
            src={profilePicture}
            size="2xl"
            rounded="md"
            alt="Profile Photo"
          />
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
        <DataListRoot variant="profileStat">
          <DataListItem label="WCA ID" value={wcaId} />
          {gender !== "o" && <DataListItem label="Gender" value={gender} />}
          <DataListItem label="Region" value={region} />
          <DataListItem label="Competitions" value={competitions} />
          <DataListItem label="Completed Solves" value={completedSolves} />
        </DataListRoot>
      </Card.Body>
      <Card.Footer>
        <Flex flexDirection="row" alignItems="flex-end">
          <Flex flexWrap="wrap">
            {" "}
            {/* TODO SLATE - fill out these badges with real info*/}
            <Badge size="lg" variant="achievement">
              <NationalChampionshipIcon />
              147 Championship Titles
            </Badge>
            <Badge size="lg" variant="achievement">
              <LuStar />
              121 Time World Record Holder
            </Badge>
            <Badge size="lg" variant="achievement">
              <RegulationsHistoryIcon />3 Year Career
            </Badge>
            <Badge size="lg" variant="achievement">
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
