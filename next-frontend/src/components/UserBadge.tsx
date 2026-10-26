import React from "react";
import {
  Card,
  Center,
  HStack,
  Image,
  LinkBox,
  LinkOverlay,
  Stack,
  Text,
} from "@chakra-ui/react";
import RoleBadge, { StaffColor } from "@/components/RoleBadge";
import Link from "next/link";
import { route } from "nextjs-routes";
import { components } from "@/types/openapi";
import EmailCopyButton from "@/components/EmailCopyButton";

interface UserBadgeData {
  name: string;
  profilePicture?: components["schemas"]["UserAvatar"];
  roles?: { teamRole: string; teamText?: string; staffColor: StaffColor }[];
  wcaId: string;
  action?: React.ReactNode;
  email?: string;
}

const UserBadge: React.FC<UserBadgeData> = ({
  name,
  profilePicture,
  roles,
  wcaId,
  action,
  email,
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
          <Image
            src={
              profilePicture.is_default
                ? "/missing_avatar_thumb.png"
                : (profilePicture.thumb_url ?? profilePicture.url)
            }
            alt="Profile Picture"
            objectFit="cover"
            // The badge needs a fixed-width column, so a non-square photo has to
            //   be cropped; anchor the crop at the top so heads survive it.
            objectPosition="top"
            width="avatarThumb"
            // Fixed width, but only a *minimum* height, so the picture stretches
            //   to the card whenever the roles wrap it taller than the thumb.
            minH="avatarThumb"
          />
        )}
        <Center flexGrow={1}>
          <Card.Body gap={2}>
            <Card.Title>
              <HStack direction="row" justify="space-between">
                <LinkOverlay asChild>
                  <Link
                    href={route({
                      pathname: "/persons/[wcaId]",
                      query: { wcaId },
                    })}
                  >
                    {name}
                  </Link>
                </LinkOverlay>
                {email && <EmailCopyButton email={email} />}
              </HStack>
            </Card.Title>
            {roles && (
              <HStack direction="row" wrap="wrap" gap="4px 8px" marginTop="4px">
                {roles.map((role, index) => (
                  <Stack key={index}>
                    <Text color="fg.muted">{role.teamText}</Text>
                    <RoleBadge
                      teamRole={role.teamRole}
                      colorPalette={role.staffColor}
                      fontSize="0.7em"
                    />
                  </Stack>
                ))}
              </HStack>
            )}
          </Card.Body>
        </Center>
        {action && (
          <Center marginStart="auto" paddingEnd="3">
            {action}
          </Center>
        )}
      </Card.Root>
    </LinkBox>
  );
};

export default UserBadge;
