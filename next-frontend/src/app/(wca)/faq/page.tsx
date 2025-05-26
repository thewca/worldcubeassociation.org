"use client";

import {
  VStack,
  Container,
  Link as ChakraLink,
  Card,
  Heading,
  Tabs,
} from "@chakra-ui/react";
import {AccordionItem, AccordionItemContent, AccordionItemTrigger, AccordionRoot} from "@chakra-ui/react";

import Link from "next/link";

export default function FAQ() {
  return (
    <Container>
    <VStack gap="8" width="full" pt="8" alignItems="left">
        <Heading size="5xl"> Frequently Asked Questions
              </Heading>
              <Card.Root maxW="40em">
                <Card.Body>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </Card.Body>
              </Card.Root>
        <Card.Root variant="hero" overflow="hidden">
            <Card.Body bg="bg">
                <Tabs.Root variant="subtle" fitted defaultValue={"tab-1"} width="full">
      <Tabs.List>
        <Tabs.Trigger value="tab-1">Tab 1</Tabs.Trigger>
        <Tabs.Trigger value="tab-2">Tab 2</Tabs.Trigger>
        <Tabs.Trigger value="tab-3">Tab 3</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="tab-1">
            <AccordionRoot multiple collapsible variant="subtle" width="full">
          <AccordionItem value="wca-id">
            <AccordionItemTrigger colorPalette="blue">
              How do I obtain a WCA ID and a WCA profile?
            </AccordionItemTrigger>
            <AccordionItemContent>
              You can obtain a WCA ID and profile by participating in an official WCA competition.
              Once your results are uploaded, your profile will be automatically created.
            </AccordionItemContent>
          </AccordionItem>
          <AccordionItem value="find-competition">
            <AccordionItemTrigger colorPalette="blue">
              How can I find a WCA competition?
            </AccordionItemTrigger>
            <AccordionItemContent>
              You can find WCA competitions on the official WCA website under the "Competitions" tab.
              There, you can filter competitions by country, date, or type.
            </AccordionItemContent>
          </AccordionItem>
        </AccordionRoot>
        </Tabs.Content>
        <Tabs.Content value="tab-2">
                        <AccordionRoot multiple collapsible variant="subtle" width="full">
          <AccordionItem value="wca-id">
            <AccordionItemTrigger colorPalette="green">
              How can I have a WCA Competition in my hometown?
            </AccordionItemTrigger>
            <AccordionItemContent>
              You can obtain a WCA ID and profile by participating in an official WCA competition.
              Once your results are uploaded, your profile will be automatically created.
            </AccordionItemContent>
          </AccordionItem>
          <AccordionItem value="find-competition">
            <AccordionItemTrigger colorPalette="green">
              What are the WCA accounts for? What is the difference between WCA accounts and WCA profiles?
            </AccordionItemTrigger>
            <AccordionItemContent>
              You can find WCA competitions on the official WCA website under the "Competitions" tab.
              There, you can filter competitions by country, date, or type.
            </AccordionItemContent>
          </AccordionItem>
        </AccordionRoot>
        </Tabs.Content>
        <Tabs.Content value="tab-3">
                        <AccordionRoot multiple collapsible variant="subtle" width="full">
          <AccordionItem value="wca-id">
            <AccordionItemTrigger colorPalette="red">
              How do I change my profile picture?
            </AccordionItemTrigger>
            <AccordionItemContent>
              You can obtain a WCA ID and profile by participating in an official WCA competition.
              Once your results are uploaded, your profile will be automatically created.
            </AccordionItemContent>
          </AccordionItem>
          <AccordionItem value="find-competition">
            <AccordionItemTrigger colorPalette="red">
              How do I connect my WCA account with my WCA ID?
            </AccordionItemTrigger>
            <AccordionItemContent>
              You can find WCA competitions on the official WCA website under the "Competitions" tab.
              There, you can filter competitions by country, date, or type.
            </AccordionItemContent>
          </AccordionItem>
        </AccordionRoot>
        </Tabs.Content>
      
    </Tabs.Root>
            </Card.Body>
        </Card.Root>
      
    </VStack>
    </Container>
  );
}
