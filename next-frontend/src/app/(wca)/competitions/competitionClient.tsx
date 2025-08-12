"use client";

import {
  useFilter,
  useListCollection,
  Container,
  VStack,
  Heading,
  Flex,
  Button,
  Text,
  Combobox,
  Portal,
  Table,
  Card,
  HStack,
  SegmentGroup,
  Slider,
  CheckboxCard,
  CheckboxGroup,
} from "@chakra-ui/react";
import { AllCompsIcon } from "@/components/icons/AllCompsIcon";
import MapIcon from "@/components/icons/MapIcon";
import ListIcon from "@/components/icons/ListIcon";
import CompetitionTableEntry from "@/components/CompetitionTableEntry";
import RemovableCard from "@/components/RemovableCard";
import CompRegoFullButOpenOrangeIcon from "@/components/icons/CompRegoFullButOpen_orangeIcon";
import CompRegoNotFullOpenGreenIcon from "@/components/icons/CompRegoNotFullOpen_greenIcon";
import CompRegoNotOpenYetGreyIcon from "@/components/icons/CompRegoNotOpenYet_greyIcon";
import CompRegoClosedRedIcon from "@/components/icons/CompRegoClosed_redIcon";
import CompRegoOpenDateIcon from "@/components/icons/CompRegoOpenDateIcon";
import CompRegoCloseDateIcon from "@/components/icons/CompRegoCloseDateIcon";
import EventIcon from "@/components/EventIcon";
import Flag from "react-world-flags";

import countries from "@/lib/wca/data/countries";
import { WCA_EVENT_IDS } from "@/lib/wca/data/events";
import type { components } from "@/types/openapi";

type CompetitionIndex = components["schemas"]["CompetitionIndex"];

interface CompetitionsListProps {
  competitions: CompetitionIndex[];
}

export default function CompetitionsClient({
  competitions,
}: CompetitionsListProps) {
  const { contains } = useFilter({ sensitivity: "base" });

  const { collection, filter } = useListCollection({
    initialItems: Object.entries(countries.byIso2).map(([code, country]) => ({
      label: country.id,
      value: code,
    })),
    filter: contains,
  });

  const marks = [
    { value: 0, label: "closest" },
    { value: 25, label: "close" },
    { value: 50, label: "far" },
    { value: 75, label: "furthest" },
    { value: 100, label: "all" },
  ];

  return (
    <Container>
      <VStack gap="8" width="full" pt="8" alignItems="left">
        <RemovableCard
          imageUrl="newcomer.png"
          heading="Why Compete?"
          description="This section will only be visible to new visitors..."
          buttonText="Learn More"
          buttonUrl="/"
        />
        <Card.Root variant="hero" size="md" overflow="hidden">
          <Card.Body bg="bg">
            <VStack gap="8" width="full" alignItems="left">
              <Heading size="5xl">
                <AllCompsIcon boxSize="1em" /> All Competitions
              </Heading>
              <Flex gap="2" width="full" alignItems="flex-start">
                <Flex gap="2" width="full" flexDirection="column">
                  <Flex gap="2" width="full" alignItems="flex-start">
                    <Combobox.Root
                      collection={collection}
                      onInputValueChange={(e) => filter(e.inputValue)}
                      width="320px"
                      colorPalette="blue"
                      openOnClick
                    >
                      <Combobox.Control>
                        <Combobox.Input placeholder="Country/Continent" />
                        <Combobox.IndicatorGroup>
                          <Combobox.ClearTrigger />
                          <Combobox.Trigger />
                        </Combobox.IndicatorGroup>
                      </Combobox.Control>
                      <Portal>
                        <Combobox.Positioner>
                          <Combobox.Content justifyContent="flex-start">
                            <Combobox.Empty>No items found</Combobox.Empty>
                            {collection.items.map((item) => (
                              <Combobox.Item item={item} key={item.value}>
                                <Flag
                                  code={item.value}
                                  fallback={item.value}
                                  height="25"
                                  width="32"
                                />
                                {item.label}
                                <Combobox.ItemIndicator />
                              </Combobox.Item>
                            ))}
                          </Combobox.Content>
                        </Combobox.Positioner>
                      </Portal>
                    </Combobox.Root>
                    {/* TODO: replace these buttons with DatePicker (Chakra does not have one by default) */}
                    <Button variant="outline">
                      <CompRegoOpenDateIcon />
                      Date From
                    </Button>
                    <Button variant="outline">
                      <CompRegoCloseDateIcon />
                      Date To
                    </Button>
                    {/* TODO: add "accordion" functionality to this button */}
                    <Button variant="outline" size="sm">
                      Advanced Filters
                    </Button>
                  </Flex>

                  <Flex gap="2" width="full" alignItems="flex-start">
                    {/* TODO: Remove Disabled parameter when user has location info shared */}
                    <Slider.Root
                      width="250px"
                      colorPalette="blue"
                      defaultValue={[100]}
                      step={25}
                      disabled
                    >
                      <Slider.Label>Distance</Slider.Label>
                      <Slider.Control>
                        <Slider.Track>
                          <Slider.Range />
                        </Slider.Track>
                        <Slider.Thumbs />
                        <Slider.Marks marks={marks} />
                      </Slider.Control>
                    </Slider.Root>

                    <CheckboxGroup>
                      <Text textStyle="sm" fontWeight="medium">
                        Select event(s)
                      </Text>
                      <HStack>
                        {WCA_EVENT_IDS.map((eventId) => (
                          <CheckboxCard.Root
                            key={eventId}
                            value={eventId}
                            align="center"
                            colorPalette="blue"
                            size="xs"
                          >
                            <CheckboxCard.HiddenInput />
                            <CheckboxCard.Control>
                              <CheckboxCard.Content>
                                <EventIcon
                                  fontSize="2xl"
                                  eventId={eventId}
                                  color="gray"
                                />
                              </CheckboxCard.Content>
                            </CheckboxCard.Control>
                          </CheckboxCard.Root>
                        ))}
                      </HStack>
                    </CheckboxGroup>
                  </Flex>
                </Flex>

                <Flex gap="2" ml="auto">
                  <SegmentGroup.Root
                    defaultValue="list"
                    size="lg"
                    colorPalette="blue"
                    variant="inset"
                  >
                    <SegmentGroup.Indicator />
                    <SegmentGroup.Items
                      items={[
                        {
                          value: "list",
                          label: (
                            <HStack>
                              <ListIcon />
                              List
                            </HStack>
                          ),
                        },
                        {
                          value: "map",
                          label: (
                            <HStack>
                              <MapIcon />
                              Map
                            </HStack>
                          ),
                        },
                      ]}
                    />
                  </SegmentGroup.Root>
                </Flex>
              </Flex>
              <Flex gap="2" width="full">
                <Text>Registration Key:</Text>
                <CompRegoFullButOpenOrangeIcon />
                <Text>Full</Text>
                <CompRegoNotFullOpenGreenIcon />
                <Text>Open</Text>
                <CompRegoNotOpenYetGreyIcon />
                <Text>Not Open</Text>
                <CompRegoClosedRedIcon />
                <Text>Closed</Text>
                <Text ml="auto">Currently Displaying: 10 competitions</Text>
              </Flex>
              <Card.Root
                bg="bg.inverted"
                color="fg.inverted"
                shadow="md"
                overflow="hidden"
                width="full"
              >
                <Card.Body p={0}>
                  <Table.Root size="xs" rounded="md" variant="competitions">
                    <Table.Body>
                      {competitions.map((comp) => (
                        <CompetitionTableEntry comp={comp} key={comp.id} />
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Card.Body>
              </Card.Root>
            </VStack>
          </Card.Body>
        </Card.Root>
      </VStack>
    </Container>
  );
}
