import { Tabs, useBreakpointValue } from "@chakra-ui/react";
import { groupTabsMap } from "./MobileTabMenu";

export default function TabsRoot({
  children,
  currentPath,
}: {
  children: React.ReactNode;
  currentPath?: string;
}) {
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Tabs.Root
      variant={isMobile ? "plain" : "enclosed"}
      width="full"
      value={isMobile ? groupTabsMap.get(currentPath || "") : currentPath}
      orientation={isMobile ? "horizontal" : "vertical"}
      sideNav={!isMobile}
      lazyMount
      unmountOnExit
      css={
        isMobile
          ? {
              "--tabs-indicator-bg": "colors.blue.emphasized",
              "--tabs-trigger-radius": "radii.2xl",
            }
          : undefined
      }
      fitted={isMobile}
    >
      {children}
    </Tabs.Root>
  );
}
