"use client";

import { Text } from "@chakra-ui/react";
import { countries } from "@/lib/staticData/wca-data";

type CountryMapProps = {
  code: string;
  bold?: boolean;
};

const CountryMap = ({ code, bold = false }: CountryMapProps) => {
  const country = countries.byIso2[code.toUpperCase()].id || "Unknown";
  return <Text fontWeight={bold ? "bold" : "normal"}>{country}</Text>;
};

export default CountryMap;
