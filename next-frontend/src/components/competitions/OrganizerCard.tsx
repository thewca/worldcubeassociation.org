"use client";

import { components } from "@/types/openapi";
import {
  Button,
  Card,
  createListCollection,
  Listbox,
  Stat,
  Text,
} from "@chakra-ui/react";
import { Link as ChakraLink } from "@chakra-ui/react";
import { MarkdownProse } from "@/components/Markdown";
import WcaDocsIcon from "@/components/icons/WcaDocsIcon";

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
            {competitionInfo.organizers.map((organizer, index) => (
              <Text as="span" key={index}>
                {organizer.url != "" ? (
                  <ChakraLink href={organizer.url}>{organizer.name}</ChakraLink>
                ) : (
                  organizer.name
                )}
                {competitionInfo.organizers.length == index + 1 ? "" : ", "}
              </Text>
            ))}
          </Stat.ValueText>
        </Stat.Root>

        <Stat.Root variant="competition">
          <Stat.Label>Delegates</Stat.Label>
          <Stat.ValueText>
            <Listbox.Root
              collection={createListCollection({
                items: competitionInfo.delegates,
              })}
            >
              <Listbox.Content>
                {competitionInfo.delegates.map((delegate) => (
                  <Listbox.Item item={delegate} key={delegate.id}>
                    <Listbox.ItemText>
                      {" "}
                      <ChakraLink href={delegate.url}>
                        {delegate.name}
                      </ChakraLink>
                    </Listbox.ItemText>
                    <Listbox.ItemIndicator />
                  </Listbox.Item>
                ))}
              </Listbox.Content>
            </Listbox.Root>
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
