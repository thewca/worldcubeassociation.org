import React from 'react';
import {Card, Center, Flex, Text} from "@chakra-ui/react";
import {Image} from "@chakra-ui/react";
import {DataListItem, DataListRoot} from "@/components/ui/data-list";
import RoleBadge from "@/components/RoleBadge";

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
    <Card.Root bg="wcawhite.muted" color="wcawhite.contrast"  h="85lvh" rounded="md" size="sm"  shadow="wca" position="sticky" top="20px">
      <Card.Header>
        <Center>
          {/* Profile Picture */}
          <Image src={profilePicture} size="2xl" rounded="md" />
        </Center>
      </Card.Header>

      <Card.Body>
        <Card.Title marginBottom={2}>
          <Text textStyle="3xl">{name}</Text>
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
        <DataListRoot orientation="horizontal">
          <DataListItem label="WCA ID" value={wcaId} />
          {gender !== "o" && <DataListItem label="Gender" value={gender} />}
          <DataListItem label="Region" value={region} />
          <DataListItem label="Competitions" value={competitions} />
          <DataListItem label="Completed Solves" value={completedSolves} />
        </DataListRoot>
      </Card.Body>
    </Card.Root>
  );
};

export default ProfileCard;
