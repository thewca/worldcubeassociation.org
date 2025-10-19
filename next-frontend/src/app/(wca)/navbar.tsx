import React from "react";
import {
  Button,
  HStack,
  IconButton,
  Menu,
  Text,
  Image as ChakraImage,
} from "@chakra-ui/react";
import { getPayload } from "payload";
import config from "@payload-config";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { RefreshRouteOnSave } from "@/components/RefreshRouteOnSave";
import { ColorModeButton } from "@/components/ui/color-mode";
import { LuChevronDown } from "react-icons/lu";

import LanguageSelector from "@/components/ui/languageSelector";
import IconDisplay from "@/components/IconDisplay";
import type { IconName } from "@/types/payload";
import AvatarMenu from "@/components/ui/avatarMenu";

type NavbarEntry<T> = {
  targetLink: T;
  displayText: string;
  displayIcon?: IconName;
};

function LinkWrapper<T extends string>({
  navbarEntry,
  linkComponent: LinkComponent,
}: {
  navbarEntry: NavbarEntry<T>;
  linkComponent: React.ElementType<{ href: T }>;
}) {
  // Have to trick the JSX type checker because TS cannot verify
  //   whether "primitive" components like `a` satisfy a generic `href: T`.
  const RawLinkComponent = LinkComponent as React.ElementType;

  return (
    <RawLinkComponent href={navbarEntry.targetLink}>
      {navbarEntry.displayIcon && (
        <IconDisplay name={navbarEntry.displayIcon} />
      )}
      {navbarEntry.displayText}
    </RawLinkComponent>
  );
}

export default async function Navbar() {
  const payload = await getPayload({ config });
  const navbar = await payload.findGlobal({ slug: "nav" });

  const session = await auth();

  return (
    <HStack
      borderBottom="md"
      padding="3"
      justifyContent="space-between"
      bg="bg"
    >
      <RefreshRouteOnSave />
      <HStack>
        <IconButton asChild variant="ghost">
          <Link href="/">
            <ChakraImage asChild maxW={10}>
              <Image src="/logo.png" alt="WCA Logo" height={50} width={50} />
            </ChakraImage>
          </Link>
        </IconButton>
        {navbar.entry.map((navbarEntry) => (
          <React.Fragment key={navbarEntry.id}>
            {navbarEntry.blockType === "LinkItem" && (
              <Button asChild variant="ghost" size="sm">
                <LinkWrapper navbarEntry={navbarEntry} linkComponent={Link} />
              </Button>
            )}
            {navbarEntry.blockType === "ExternalLinkItem" && (
              <Button asChild variant="ghost" size="sm">
                <LinkWrapper navbarEntry={navbarEntry} linkComponent="a" />
              </Button>
            )}
            {navbarEntry.blockType === "NavDropdown" && (
              <Menu.Root>
                <Menu.Trigger asChild>
                  <Button variant="ghost" size="sm">
                    {navbarEntry.displayIcon && (
                      <IconDisplay name={navbarEntry.displayIcon} />
                    )}
                    {navbarEntry.title}
                    <LuChevronDown />
                  </Button>
                </Menu.Trigger>
                <Menu.Positioner>
                  <Menu.Content>
                    {navbarEntry.entries.map((subEntry) => (
                      <React.Fragment key={subEntry.id}>
                        {subEntry.blockType === "LinkItem" && (
                          <Menu.Item
                            value={`${navbarEntry.id}/${subEntry.id}`}
                            asChild
                          >
                            <LinkWrapper
                              navbarEntry={subEntry}
                              linkComponent={Link}
                            />
                          </Menu.Item>
                        )}
                        {subEntry.blockType === "ExternalLinkItem" && (
                          <Menu.Item
                            value={`${navbarEntry.id}/${subEntry.id}`}
                            asChild
                          >
                            <LinkWrapper
                              navbarEntry={subEntry}
                              linkComponent="a"
                            />
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
                                      <Menu.Item
                                        value={`${navbarEntry.id}/${subEntry.id}/${nestedEntry.id}`}
                                        asChild
                                      >
                                        <LinkWrapper
                                          navbarEntry={nestedEntry}
                                          linkComponent={Link}
                                        />
                                      </Menu.Item>
                                    )}
                                    {nestedEntry.blockType ===
                                      "ExternalLinkItem" && (
                                      <Menu.Item
                                        value={`${navbarEntry.id}/${subEntry.id}/${nestedEntry.id}`}
                                        asChild
                                      >
                                        <LinkWrapper
                                          navbarEntry={nestedEntry}
                                          linkComponent="a"
                                        />
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
        <LanguageSelector />
        <AvatarMenu session={session} />
      </HStack>
    </HStack>
  );
}
