"use client";

import React, { createContext, use } from "react";
import { Button, Collapsible, useCollapsible } from "@chakra-ui/react";

// Sub-menus are nested Collapsibles, so links can't reach the outer menu
// through useCollapsibleContext.
const CloseMobileNavContext = createContext<() => void>(() => {});

export function MobileNavRoot({ children }: { children: React.ReactNode }) {
  const collapsible = useCollapsible();

  return (
    <Collapsible.RootProvider value={collapsible}>
      <CloseMobileNavContext value={() => collapsible.setOpen(false)}>
        {children}
      </CloseMobileNavContext>
    </Collapsible.RootProvider>
  );
}

export function MobileNavLink({ children }: { children: React.ReactNode }) {
  const closeMobileNav = use(CloseMobileNavContext);

  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      justifyContent="flex-start"
      onClick={closeMobileNav}
    >
      {children}
    </Button>
  );
}
