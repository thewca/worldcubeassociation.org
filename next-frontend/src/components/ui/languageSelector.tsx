"use client";

import { Menu, Button, ClientOnly, Skeleton } from "@chakra-ui/react";
import React from "react";
import { LuChevronDown } from "react-icons/lu";
import {
  coerceLanguageCode,
  fallbackLng,
  storageKey,
} from "@/lib/i18n/settings";
import availableLocales from "@/lib/i18n/locales/available.json";
import Cookies from "js-cookie";

export default function Wrapper() {
  return (
    <ClientOnly fallback={<Skeleton boxSize="8" />}>
      <LanguageSelector />
    </ClientOnly>
  );
}

const LanguageSelector = () => {
  const currentLocaleRaw = Cookies.get(storageKey) ?? fallbackLng;
  const currentLocale = coerceLanguageCode(currentLocaleRaw);

  const handleChangeLocale = (code: string) => {
    Cookies.set(storageKey, code, { expires: 365, path: "/" });
    // We need to reload because we render a lot of sites on the server
    window.location.reload();
  };

  const currentLanguageLabel = availableLocales[currentLocale]?.name;

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
            {Object.entries(availableLocales).map(([lang, config]) => (
              <Menu.Item
                value={lang}
                key={lang}
                onClick={() => handleChangeLocale(lang)}
              >
                {config.name}
              </Menu.Item>
            ))}
          </Menu.ItemGroup>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
};
