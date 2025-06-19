import React from "react";
import { Box, Card, HStack, Text } from "@chakra-ui/react";
import NextImage from "next/image";
import RoleBadge, { StaffColor } from "@/components/RoleBadge";
import Link from "next/link";

interface UserBadgeData {
  name: string;
  profilePicture: string;
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
    <Card.Root
      bg="grey.solid"
      color="wcawhite.contrast"
      maxWidth="400px"
      height="120px"
      rounded="xl"
      size="sm"
      shadow="wca"
      position="sticky"
      top="20px"
    >
      <Card.Header>
        <Link href={`/persons/${wcaId}`}>
          <HStack direction="row" align="center" gap="16px">
            <Box
              width="80px"
              height="80px"
              position="relative"
              overflow="hidden"
              borderRadius="md"
            >
              <NextImage
                src={profilePicture}
                alt="Profile Photo"
                fill
                style={{ objectFit: "cover" }}
              />
            </Box>
            <Box>
              <Text textStyle="3xl" fontWeight="bold">
                {name}
              </Text>
              {roles && (
                <HStack
                  direction="row"
                  wrap="wrap"
                  gap="4px 8px"
                  marginTop="4px"
                >
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
            </Box>
          </HStack>
        </Link>
      </Card.Header>
    </Card.Root>
  );
};

export default UserBadge;
