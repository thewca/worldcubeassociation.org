import * as React from "react";
import { Center, Heading, Stack } from "@chakra-ui/react";
import { Accordion } from "@chakra-ui/react";

export default function Home() {
  return (
    <Center>
      <Stack maxW="2xl">
        {/* Page Title */}
        <Heading>FREQUENTLY ASKED QUESTIONS</Heading>

        {/* FAQ Items */}
        <Accordion.Root multiple collapsible variant="subtle" width="full">
          <Accordion.Item value="wca-id">
            <Accordion.ItemTrigger colorPalette="blue">
              How do I obtain a WCA ID and a WCA profile?
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              You can obtain a WCA ID and profile by participating in an
              official WCA competition. Once your results are uploaded, your
              profile will be automatically created.
            </Accordion.ItemContent>
          </Accordion.Item>
          <Accordion.Item value="find-competition">
            <Accordion.ItemTrigger colorPalette="blue">
              How can I find a WCA competition?
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              You can find WCA competitions on the official WCA website under
              the &quot;Competitions&quot; tab. There, you can filter competitions by
              country, date, or type.
            </Accordion.ItemContent>
          </Accordion.Item>
          <Accordion.Item value="register">
            <Accordion.ItemTrigger colorPalette="blue">
              How can I register for a competition? Who can I refer to if I have
              problems registering for a competition?
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              Many competitions do registration right here on the WCA website,
              but some use their own systems. You should contact the organizers
              of the competition you want to compete in for more details.
              {/* Search for Competition */}
            </Accordion.ItemContent>
          </Accordion.Item>
          <Accordion.Item value="requirements">
            <Accordion.ItemTrigger colorPalette="blue">
              What are the requirements for attending a WCA competition? What do
              I need to know before attending a WCA competition?
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              Familiarize yourself with the WCA regulations and ensure you
              understand the competition flow. Competitors must bring their own
              cubes and follow the rules.
            </Accordion.ItemContent>
          </Accordion.Item>
          <Accordion.Item value="comp-hometown">
            <Accordion.ItemTrigger colorPalette="red">
              How can I have a WCA competition in my hometown?
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              If you are interested in organizing a competition, it&apos;s highly
              recommended to attend at least one or two competitions as a
              competitor to learn from the experience. WCA Competitions must
              follow the <a href="#">WCA Regulations</a>. After that, the
              organization team must contact a nearby{" "}
              <a href="#">WCA Delegate</a>. Visit the{" "}
              <a href="#">WCA Competition Organizer Guidelines</a> for further
              information.
            </Accordion.ItemContent>
          </Accordion.Item>
        </Accordion.Root>
      </Stack>
    </Center>
  );
}
