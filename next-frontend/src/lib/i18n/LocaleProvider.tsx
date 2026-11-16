"use client";

import React, { createContext, use } from "react";
import { fallbackLng } from "./settings";

// The browser can't read the language the server picked from Accept-Language, so the server
//   hands it down. Otherwise server and client render different languages and hydration fails.
const LocaleContext = createContext<string>(fallbackLng);

export default function LocaleProvider({
  lng,
  children,
}: {
  lng: string;
  children: React.ReactNode;
}) {
  return <LocaleContext value={lng}>{children}</LocaleContext>;
}

export const useLocale = () => use(LocaleContext);
