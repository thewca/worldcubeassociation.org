"use server";

import React from "react";
import { Button, HStack, IconButton, Menu, Text } from "@chakra-ui/react";
import { getPayload } from "payload";
import config from "@payload-config";
import Link from "next/link";
import { RefreshRouteOnSave } from "@/components/RefreshRouteOnSave";
import { ColorModeButton } from "@/components/ui/color-mode";
import { LuChevronDown, LuHouse } from "react-icons/lu";

export default async function Navbar() {
  const payload = await getPayload({ config });
  const navbar = await payload.findGlobal({ slug: "nav" });

  return (
    <HStack borderBottom="md" padding="3" justifyContent="space-between">
      <RefreshRouteOnSave />
      <HStack>
        <IconButton asChild variant="ghost">
          <Link href={"/"}>
            <LuHouse />
          </Link>
        </IconButton>
        {navbar.entry.map((navbarEntry) => (
          <React.Fragment key={navbarEntry.id}>
            {navbarEntry.blockType === "LinkItem" && (
              <Button asChild variant="outline">
                <Link href={navbarEntry.targetLink}>
                  {navbarEntry.displayText}
                </Link>
              </Button>
            )}
            {navbarEntry.blockType === "NavDropdown" && (
              <Menu.Root>
                <Menu.Trigger asChild>
                  <Button variant="outline">
                    {navbarEntry.title}
                    <LuChevronDown />
                  </Button>
                </Menu.Trigger>
                <Menu.Positioner>
                  <Menu.Content>
                    {navbarEntry.entries.map((subEntry) => (
                      <React.Fragment key={subEntry.id}>
                        {subEntry.blockType === "LinkItem" && (
                          <Menu.Item value={subEntry.id!} asChild>
                            <Link href={subEntry.targetLink}>
                              {subEntry.displayText}
                            </Link>
                          </Menu.Item>
                        )}
                        {subEntry.blockType === "VisualDivider" && (
                          <Menu.Separator />
                        )}
                        {subEntry.blockType === "NestedDropdown" && (
                          <Menu.Root
                            positioning={{
                              placement: "right-start",
                              gutter: -2,
                            }}
                          >
                            <Menu.TriggerItem>
                              {subEntry.title}
                            </Menu.TriggerItem>
                            <Menu.Positioner>
                              <Menu.Content>
                                {subEntry.entries.map((nestedEntry) => (
                                  <React.Fragment key={nestedEntry.id}>
                                    {nestedEntry.blockType === "LinkItem" && (
                                      <Menu.Item value={nestedEntry.id!}>
                                        <Link href={nestedEntry.targetLink}>
                                          {nestedEntry.displayText}
                                        </Link>
                                      </Menu.Item>
                                    )}
                                  </React.Fragment>
                                ))}
                              </Menu.Content>
                            </Menu.Positioner>
                          </Menu.Root>
                        )}
                      </React.Fragment>
                    ))}
                  </Menu.Content>
                </Menu.Positioner>
              </Menu.Root>
            )}
          </React.Fragment>
        ))}
      </HStack>
      <HStack>
        {navbar.entry.length === 0 && (
          <Text>Oh no, there are no navbar items!</Text>
        )}
      </HStack>
      <HStack>
        <ColorModeButton />
        <Button asChild variant="outline">
          <Link href="/admin">Payload CMS</Link>
        </Button>
      </HStack>
    </HStack>
  );
}
