"use client";

import { components } from "@/types/openapi";
import {
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  Card,
  CloseButton,
  Dialog,
  // Carousel,
  HStack,
  Icon,
  Portal,
  // IconButton,
  Stack,
  Stat,
  Text,
} from "@chakra-ui/react";
import { Link as ChakraLink } from "@chakra-ui/react";
import { ChakraMarkdown } from "@/components/Markdown";
import WcaDocsIcon from "@/components/icons/WcaDocsIcon";
import {
  // LuChevronLeft,
  LuChevronRight,
  LuFlag,
} from "react-icons/lu";
import { useT } from "@/lib/i18n/useI18n";
import { usePathname } from "next/navigation";

type OrganizerPerson =
  components["schemas"]["Person"] | components["schemas"]["Organizer"];

// function OrganizerCarousel({ organizers }: { organizers: OrganizerPerson[] }) {
//   return (
//     <Carousel.Root
//       orientation="horizontal"
//       slideCount={organizers.length}
//       autoSize
//       spacing="30px"
//       maxW="full"
//       allowMouseDrag
//     >
//       <Carousel.Control justifyContent="start" gap="4" width="full">
//         <Carousel.PrevTrigger asChild>
//           <IconButton size="xs" variant="ghost">
//             <LuChevronLeft />
//           </IconButton>
//         </Carousel.PrevTrigger>
//         <Carousel.ItemGroup>
//           {organizers.map((delegate, index) => (
//             <Carousel.Item
//               key={index}
//               index={index}
//               snapAlign="center"
//               width="auto"
//             >
//               <HStack>
//                 <Avatar.Root>
//                   <Avatar.Fallback name={delegate.name} />
//                   <Avatar.Image src={delegate.avatar.thumb_url} />
//                 </Avatar.Root>
//                 <ChakraLink href={delegate.url}>{delegate.name}</ChakraLink>
//               </HStack>
//             </Carousel.Item>
//           ))}
//         </Carousel.ItemGroup>
//         <Carousel.NextTrigger asChild>
//           <IconButton size="xs" variant="ghost">
//             <LuChevronRight />
//           </IconButton>
//         </Carousel.NextTrigger>
//       </Carousel.Control>
//     </Carousel.Root>
//   );
// }

function ClickableOrganizer({
  organizer,
  isLead = false,
}: {
  organizer: OrganizerPerson;
  isLead?: boolean;
}) {
  return (
    <HStack key={organizer.id}>
      <Avatar.Root>
        <Avatar.Fallback name={organizer.name} />
        <Avatar.Image src={organizer.avatar.thumb_url} />
      </Avatar.Root>
      <Stack gap={0.5} justify="start">
        <ChakraLink href={organizer.url}>{organizer.name}</ChakraLink>
        {isLead && (
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
        )}
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

  return (
    <Stack direction="row" gap={3}>
      {first && <ClickableOrganizer organizer={first} isLead />}
      {rest.length && (
        <Dialog.Root placement="center" lazyMount>
          <Dialog.Trigger asChild>
            <Card.Root
              asChild
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
                onClick={() => {}}
                aria-haspopup="dialog"
                aria-label={`View ${rest.length} more team members`}
              >
                <Card.Body
                  py="1"
                  px="1.5"
                  flexDirection="row"
                  alignItems="center"
                  gap={2}
                >
                  <AvatarGroup>
                    {rest.map((delegate) => (
                      <Avatar.Root key={delegate.id} size="xs">
                        <Avatar.Fallback name={delegate.name} />
                        <Avatar.Image src={delegate.avatar.thumb_url} />
                      </Avatar.Root>
                    ))}
                  </AvatarGroup>
                  <Text fontSize="xs"> +{rest.length} more</Text>
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
  const pathname = usePathname();
  const scheduleHref = `${pathname.replace(/\/$/, "")}/schedule`;

  const isPlural = (arr: OrganizerPerson[]) => arr.length > 1;

  return (
    // No width floor: from `md` the page puts this card in one of two columns *beside*
    //   the tab sidebar, which leaves each column narrower than the floor used to be.
    <Card.Root>
      <Card.Body>
        <Card.Title textStyle="s4">
          {t("competitions.competition_info.organization_team")}
        </Card.Title>
        <Stat.Root variant="competition">
          <Stat.Label fontWeight="medium">
            {t(
              `competitions.competition_info.organizer_plural.${isPlural(competitionInfo.organizers) ? "other" : "one"}`,
            )}
          </Stat.Label>
          <Stat.ValueText>
            <OrganizersSection
              organizers={competitionInfo.organizers}
              mode="organizers"
            />
            {/* <OrganizerCarousel organizers={competitionInfo.organizers} /> */}
          </Stat.ValueText>
        </Stat.Root>

        <Stat.Root variant="competition">
          <Stat.Label fontWeight="medium">
            {t(
              `competitions.competition_info.delegate.${isPlural(competitionInfo.delegates) ? "other" : "one"}`,
            )}
          </Stat.Label>
          <Stat.ValueText>
            <OrganizersSection
              organizers={competitionInfo.delegates}
              mode="delegates"
            />
            {/* <OrganizerCarousel organizers={competitionInfo.delegates} /> */}
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

        <Button variant="outline" colorPalette="blue" asChild>
          <ChakraLink textStyle="headerLink" href={scheduleHref}>
            Download Competition PDF
            <WcaDocsIcon />
          </ChakraLink>
        </Button>
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
          {organizers.map((organizer, i) => (
            <ClickableOrganizer
              key={organizer.id}
              organizer={organizer}
              isLead={i === 0}
            />
          ))}
        </Stack>
      </Dialog.Body>
    </Dialog.Content>
  );
}
