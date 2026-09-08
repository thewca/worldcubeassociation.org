"use client";

import React from "react";
import { Collapsible } from "@chakra-ui/react";
import { usePathname } from "next/navigation";

export default function NavCollapsible({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => setOpen(false), [pathname]);

  return (
    <Collapsible.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
      {children}
    </Collapsible.Root>
  );
}
