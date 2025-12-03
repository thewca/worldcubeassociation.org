"use client";

import { components } from "@/types/openapi";
import {
  Avatar,
  Button,
  Card,
  Carousel,
  HStack,
  IconButton,
  Stat,
  Text,
} from "@chakra-ui/react";
import { Link as ChakraLink } from "@chakra-ui/react";
import { MarkdownProse } from "@/components/Markdown";
import WcaDocsIcon from "@/components/icons/WcaDocsIcon";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

function OrganizerCarousel({
  organizers,
}: {
  organizers:
    | components["schemas"]["Person"][]
    | components["schemas"]["Organizer"][];
}) {
  return (
    <Carousel.Root
      orientation="horizontal"
      slideCount={organizers.length}
      autoSize
      allowMouseDrag
      slidesPerPage={1}
      maxW="2xs"
    >
      <Carousel.ItemGroup>
        {organizers.map((delegate, index) => (
          <Carousel.Item key={index} index={index}>
            <HStack>
              <Avatar.Root>
                <Avatar.Fallback name={delegate.name} />
                <Avatar.Image src={delegate.avatar.thumb_url} />
              </Avatar.Root>
              <ChakraLink href={delegate.url}>{delegate.name}</ChakraLink>
            </HStack>
          </Carousel.Item>
        ))}
      </Carousel.ItemGroup>
      <Carousel.Control justifyContent="space-between" gap="4">
        <Carousel.PrevTrigger asChild>
          <IconButton size="xs" variant="ghost">
            <LuChevronLeft />
          </IconButton>
        </Carousel.PrevTrigger>

        <Carousel.Indicators />

        <Carousel.NextTrigger asChild>
          <IconButton size="xs" variant="ghost">
            <LuChevronRight />
          </IconButton>
        </Carousel.NextTrigger>
      </Carousel.Control>
    </Carousel.Root>
  );
}

export default function OrganizationTeamCard({
  competitionInfo,
}: {
  competitionInfo: components["schemas"]["CompetitionInfo"];
}) {
  return (
    <Card.Root minW="xs">
      <Card.Body>
        <Card.Title textStyle="s4">Organization Team</Card.Title>
        <Stat.Root variant="competition">
          <Stat.Label>Organizers</Stat.Label>
          <Stat.ValueText>
            <OrganizerCarousel organizers={competitionInfo.organizers} />
          </Stat.ValueText>
        </Stat.Root>

        <Stat.Root variant="competition">
          <Stat.Label>Delegates</Stat.Label>
          <Stat.ValueText>
            <OrganizerCarousel organizers={competitionInfo.delegates} />
          </Stat.ValueText>
        </Stat.Root>

        {competitionInfo.contact && (
          <Stat.Root variant="competition">
            <Stat.Label>Contact</Stat.Label>
            <MarkdownProse
              as={Stat.ValueText}
              content={competitionInfo.contact}
            />
          </Stat.Root>
        )}

        <Button variant="outline" colorPalette="blue" asChild>
          <ChakraLink
            textStyle="headerLink"
            href={
              "https://www.worldcubeassociation.org/competitions/" +
              competitionInfo.id +
              ".pdf"
            }
          >
            Download Competition PDF
            <WcaDocsIcon />
          </ChakraLink>
        </Button>
      </Card.Body>
    </Card.Root>
  );
}
