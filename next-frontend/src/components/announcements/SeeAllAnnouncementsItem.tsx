"use client";

// "use client" is required here: Ark UI's `asChild` renders nothing when its child element
// crosses the RSC boundary, because it then arrives as a lazy client reference instead of a
// React element. Creating the child in a client module keeps SSR and hydration in sync.

import { Accordion, Link as ChakraLink } from "@chakra-ui/react";
import { LuChevronsRight } from "react-icons/lu";

export default function SeeAllAnnouncementsItem() {
  return (
    <Accordion.Item value="see-all" layerStyle="fill.subtle">
      <Accordion.ItemTrigger textStyle="s1" asChild>
        <ChakraLink href="/posts" color="currentColor">
          <Accordion.ItemIndicator transition={undefined}>
            <LuChevronsRight />
          </Accordion.ItemIndicator>
          See all announcements
        </ChakraLink>
      </Accordion.ItemTrigger>
    </Accordion.Item>
  );
}
