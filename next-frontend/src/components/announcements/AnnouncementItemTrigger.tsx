"use client";

import { Accordion, useAccordionItemContext } from "@chakra-ui/react";
import type { ReactNode } from "react";

export default function AnnouncementItemTrigger({
  children,
}: {
  children: ReactNode;
}) {
  const { expanded } = useAccordionItemContext();

  return (
    <Accordion.ItemTrigger
      disabled={expanded}
      _open={{ textStyle: "h2" }}
      _disabled={{ opacity: 1, cursor: "default" }}
    >
      {children}
    </Accordion.ItemTrigger>
  );
}
