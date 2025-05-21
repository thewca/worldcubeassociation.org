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
  Switch,
  Icon,
  Combobox,
  Portal,
  Table,
  Card,
} from "@chakra-ui/react";
import AllCompsIcon from "@/components/icons/AllCompsIcon";
import MapIcon from "@/components/icons/MapIcon";
import ListIcon from "@/components/icons/ListIcon";
import CompetitionTableEntry from "@/components/CompetitionTableEntry";
import RemovableCard from "@/components/RemovableCard";
import CompRegoFullButOpenOrangeIcon from "@/components/icons/CompRegoFullButOpen_orangeIcon";
import CompRegoNotFullOpenGreenIcon from "@/components/icons/CompRegoNotFullOpen_greenIcon";
import CompRegoNotOpenYetGreyIcon from "@/components/icons/CompRegoNotOpenYet_greyIcon";
import CompRegoClosedRedIcon from "@/components/icons/CompRegoClosed_redIcon";
import { countryCodeMapping } from "@/components/CountryMap";

import Flag from "react-world-flags";

export default function CompetitionsClient({ competitions }) {

  const countries = Object.entries(countryCodeMapping).map(([code, name]) => ({
    label: name,
    value: code,
  }));
  console.log(countries);

  const { contains } = useFilter({ sensitivity: "base", keys: ["label"] });
  const { collection, filter } = useListCollection({
    initialItems: countries,
    filter: contains,
  });

  return (
    <Container>
      <VStack gap="8" width="full" pt="8" alignItems="left">
        <RemovableCard
          imageUrl="https://ando527.github.io/wcaWireframes/images/newcomer.png"
          heading="Why Compete?"
          description="This section will only be visible to new visitors..."
          buttonText="Learn More"
          buttonUrl="/"
        />
        <Heading size="5xl">
          <AllCompsIcon boxSize="1em" /> All Competitions
        </Heading>
        <Flex gap="2" width="full">
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
                    <Flag code={item.value} fallback={item.value} height="25" width="32"/>
                      {item.label}
                      <Combobox.ItemIndicator />
                    </Combobox.Item>
                  ))}
                </Combobox.Content>
              </Combobox.Positioner>
            </Portal>
          </Combobox.Root>
          <Button variant="outline">Filter 2</Button>
          <Button variant="solid">Filter 3</Button>
          <Switch.Root colorPalette="blue" size="lg">
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
              <Switch.Indicator
                fallback={<Icon as={ListIcon} color="gray.400" />}
              >
                <Icon as={MapIcon} colorPalette="yellow.400" />
              </Switch.Indicator>
            </Switch.Control>
            <Switch.Label>Map View</Switch.Label>
          </Switch.Root>
          <Flex gap="2" ml="auto">
            <Button variant="outline">Filter Right</Button>
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
          shadow="wca"
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
    </Container>
  );
}
