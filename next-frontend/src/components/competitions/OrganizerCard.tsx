"use client";

import { components } from "@/types/openapi";
import {
  Avatar,
  AvatarGroup,
  // Badge,
  Card,
  CloseButton,
  Dialog,
  HStack,
  Icon,
  Portal,
  Stack,
  Stat,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
import { Link as ChakraLink } from "@chakra-ui/react";
import { ChakraMarkdown } from "@/components/Markdown";
import {
  LuChevronRight,
  // LuFlag,
} from "react-icons/lu";
import { useT } from "@/lib/i18n/useI18n";
import WcaFlag from "../WcaFlag";

type OrganizerPerson =
  components["schemas"]["Person"] | components["schemas"]["Organizer"];

// Lead section commented out for future implementation

function ClickableOrganizer({
  organizer,
  // isLead = false,
}: {
  organizer: OrganizerPerson;
  // isLead?: boolean;
}) {
  return (
    <HStack key={organizer.id} minW={0}>
      <Avatar.Root flexShrink={0} size={{ base: "md", lg: "sm", xl: "md" }}>
        <Avatar.Fallback name={organizer.name} />
        <Avatar.Image src={organizer.avatar.thumb_url} />
      </Avatar.Root>
      <Stack gap={0.5} justify="start" minW={0}>
        <ChakraLink
          href={organizer.url}
          display="flex"
          alignItems="center"
          minW={0}
          title={organizer.name}
          gap={{ base: 2, lg: 1, xl: 2 }}
        >
          <Text as="span" truncate minW={0}>
            {organizer.name}
          </Text>
          <WcaFlag
            code={organizer.country_iso2}
            size="xs"
            flexShrink={0}
            aria-hidden
          />
        </ChakraLink>
        {/* {isLead && (
          <Badge
            variant="subtle"
            colorPalette="blue"
            w="fit-content"
            rounded="full"
            px="2"
            size="xs"
          >
            <Icon>
              <LuFlag />
            </Icon>
            Lead
          </Badge>
        )} */}
      </Stack>
    </HStack>
  );
}

function OrganizersSection({
  organizers,
  mode,
}: {
  organizers: OrganizerPerson[];
  mode: "organizers" | "delegates";
}) {
  const { t } = useT();
  const first = organizers[0];
  const rest = organizers.slice(1);

  const avatarLimit =
    useBreakpointValue(
      {
        base: 2,
        sm: 6,
        lg: 2,
        xl: 6,
      },
      { fallback: "md" },
    ) || 4;

  // Doing it directly on the element made the linter split it into multiple lines
  // but this caused the Ruby test for unused i18n keys to fail
  const ariaLabel = t("competitions.competition_info.view_more_members", {
    count: rest.length,
  });

  return (
    <Stack direction="row" gap={{ base: 3, lg: 1, xl: 3 }} minW={0} maxW="full">
      {first && <ClickableOrganizer organizer={first} />}
      {!!rest.length && (
        <Dialog.Root placement="center" lazyMount>
          <Dialog.Trigger asChild>
            <Card.Root
              asChild
              flexShrink={0}
              variant="outline"
              rounded="full"
              cursor="pointer"
              transition="backgrounds"
              _hover={{ bg: "bg.muted" }}
              _active={{ bg: "bg.emphasized" }}
              focusVisibleRing="outside"
            >
              <button
                type="button"
                aria-haspopup="dialog"
                aria-label={ariaLabel}
              >
                <Card.Body
                  py="1"
                  px="1.5"
                  flexDirection="row"
                  alignItems="center"
                  gap={{ base: 2, lg: 0, xl: 2 }}
                >
                  <AvatarGroup>
                    {rest
                      .filter((_, i) => i < avatarLimit)
                      .map((delegate) => (
                        <Avatar.Root key={delegate.id} size="xs">
                          <Avatar.Fallback name={delegate.name} />
                          <Avatar.Image src={delegate.avatar.thumb_url} />
                        </Avatar.Root>
                      ))}
                  </AvatarGroup>
                  <Text fontSize="xs">
                    {t("competitions.competition_info.see_more", {
                      count: rest.length,
                    })}
                  </Text>
                  <Icon>
                    <LuChevronRight />
                  </Icon>
                </Card.Body>
              </button>
            </Card.Root>
          </Dialog.Trigger>
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <OrganizersModal
                organizers={organizers}
                title={t(
                  `competitions.competition_info.${mode === "organizers" ? "organizer_plural" : "delegate"}.other`,
                )}
              />
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      )}
    </Stack>
  );
}

export default function OrganizationTeamCard({
  competitionInfo,
}: {
  competitionInfo: components["schemas"]["CompetitionInfo"];
}) {
  const { t } = useT();

  const isPlural = (arr: OrganizerPerson[]) => arr.length > 1;

  return (
    // No width floor: from `md` the page puts this card in one of two columns *beside*
    //   the tab sidebar, which leaves each column narrower than the floor used to be.
    <Card.Root>
      <Card.Body>
        <Card.Title textStyle="s4">
          {t("competitions.competition_info.organization_team")}
        </Card.Title>
        <Stat.Root variant="competition" minW={0}>
          <Stat.Label fontWeight="medium">
            {t(
              `competitions.competition_info.organizer_plural.${isPlural(competitionInfo.organizers) ? "other" : "one"}`,
            )}
          </Stat.Label>
          <Stat.ValueText minW={0} maxW="full">
            <OrganizersSection
              organizers={competitionInfo.organizers}
              mode="organizers"
            />
          </Stat.ValueText>
        </Stat.Root>

        <Stat.Root variant="competition" minW={0}>
          <Stat.Label fontWeight="medium">
            {t(
              `competitions.competition_info.delegate.${isPlural(competitionInfo.delegates) ? "other" : "one"}`,
            )}
          </Stat.Label>
          <Stat.ValueText minW={0} maxW="full">
            <OrganizersSection
              organizers={competitionInfo.delegates}
              mode="delegates"
            />
          </Stat.ValueText>
        </Stat.Root>

        {competitionInfo.contact && (
          <Stat.Root variant="competition">
            <Stat.Label>Contact</Stat.Label>
            <ChakraMarkdown paragraphAs={Stat.ValueText}>
              {competitionInfo.contact}
            </ChakraMarkdown>
          </Stat.Root>
        )}
      </Card.Body>
    </Card.Root>
  );
}

function OrganizersModal({
  organizers,
  title,
}: {
  organizers: OrganizerPerson[];
  title: string;
}) {
  return (
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>{title}</Dialog.Title>
      </Dialog.Header>
      <Dialog.CloseTrigger asChild>
        <CloseButton size="sm" />
      </Dialog.CloseTrigger>
      <Dialog.Body>
        <Stack>
          {organizers.map((organizer) => (
            <ClickableOrganizer key={organizer.id} organizer={organizer} />
          ))}
        </Stack>
      </Dialog.Body>
    </Dialog.Content>
  );
}
