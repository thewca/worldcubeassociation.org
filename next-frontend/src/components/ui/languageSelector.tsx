"use client";

import { Menu, Button, ClientOnly, Skeleton } from "@chakra-ui/react";
import React from "react";
import { LuChevronDown } from "react-icons/lu";
import { fallbackLng, languages, storageKey } from "@/lib/i18n/settings";
import Cookies from "js-cookie";

export default function Wrapper() {
  return (
    <ClientOnly fallback={<Skeleton boxSize="8" />}>
      <LanguageSelector />
    </ClientOnly>
  );
}

const LanguageSelector = () => {
  const currentLocale = Cookies.get(storageKey) ?? fallbackLng;

  const handleChangeLocale = (code: string) => {
    Cookies.set(storageKey, code, { expires: 365, path: "/" });
    // We need to reload because we render a lot of sites on the server
    window.location.reload();
  };

  const currentLanguageLabel = languages.find((lang) => lang === currentLocale);

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button variant="ghost" size="sm">
          {currentLanguageLabel}
          <LuChevronDown />
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.ItemGroup>
            {languages.map((lang) => (
              <Menu.Item
                value={lang}
                key={lang}
                onClick={() => handleChangeLocale(lang)}
              >
                {lang}
              </Menu.Item>
            ))}
          </Menu.ItemGroup>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
};
