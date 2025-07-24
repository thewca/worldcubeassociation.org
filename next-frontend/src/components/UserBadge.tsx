import React from "react";
import {
  Box,
  Card,
  Center,
  HStack,
  LinkBox,
  LinkOverlay,
} from "@chakra-ui/react";
import Image from "next/image";
import RoleBadge, { StaffColor } from "@/components/RoleBadge";
import Link from "next/link";

interface UserBadgeData {
  name: string;
  profilePicture?: string;
  roles?: { teamRole: string; teamText?: string; staffColor: StaffColor }[];
  wcaId: string;
}

const UserBadge: React.FC<UserBadgeData> = ({
  name,
  profilePicture,
  roles,
  wcaId,
}) => {
  return (
    <LinkBox asChild>
      <Card.Root
        bg="grey.solid"
        color="wcawhite.contrast"
        rounded="xl"
        size="sm"
        shadow="wca"
        flexDirection="row"
        overflow="hidden"
        maxW="xl"
      >
        {profilePicture && (
          <Box objectFit="cover" width="75px" height="75px" position="relative">
            <Image
              src={profilePicture}
              alt="Profile Picture"
              fill
              style={{ objectFit: "cover" }}
            />
          </Box>
        )}
        <Center>
          <Card.Body>
            <Card.Title>
              <LinkOverlay asChild>
                <Link href={`/persons/${wcaId}`}>{name}</Link>
              </LinkOverlay>
            </Card.Title>
            {roles && (
              <HStack direction="row" wrap="wrap" gap="4px 8px" marginTop="4px">
                {roles.map((role, index) => (
                  <RoleBadge
                    key={index}
                    teamRole={role.teamRole}
                    teamText={role.teamText ?? ""}
                    staffColor={role.staffColor}
                    fontSize={"0.7em"}
                  />
                ))}
              </HStack>
            )}
          </Card.Body>
        </Center>
      </Card.Root>
    </LinkBox>
  );
};

export default UserBadge;
