"use client";

import { ChakraProvider, type ChakraProviderProps } from "@chakra-ui/react";

import { system } from "@/theme";

type ProviderProps = Omit<ChakraProviderProps, "value">;

export function Provider(props: ProviderProps) {
  return <ChakraProvider value={system} {...props} />;
}
