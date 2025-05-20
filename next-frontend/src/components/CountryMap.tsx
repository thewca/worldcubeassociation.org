"use client";

import { Text } from "@chakra-ui/react";

const countryCodeMapping: Record<string, string> = {
  // Africa
  DZ: "Algeria",
  EG: "Egypt",
  GH: "Ghana",
  KE: "Kenya",
  MA: "Morocco",
  NG: "Nigeria",
  ZA: "South Africa",
  MU: "Mauritius",

  // Asia
  AF: "Afghanistan",
  CN: "China",
  HK: "Hong Kong",
  IN: "India",
  ID: "Indonesia",
  IR: "Iran",
  IL: "Israel",
  JP: "Japan",
  KZ: "Kazakhstan",
  KR: "Republic of Korea",
  KW: "Kuwait",
  LB: "Lebanon",
  MY: "Malaysia",
  PH: "Philippines",
  QA: "Qatar",
  SA: "Saudi Arabia",
  SG: "Singapore",
  TW: "Chinese Taipei",
  TH: "Thailand",
  TR: "Turkey",
  AE: "United Arab Emirates",
  VN: "Vietnam",
  AZ: "Azerbaijan",
  MN: "Mongolia",
  NP: "Nepal",
  LK: "Sri Lanka",
  BT: "Bhutan",
  BD: "Bangladesh",
  KG: "Kyrgyzstan",

  // Europe
  AT: "Austria",
  BE: "Belgium",
  BG: "Bulgaria",
  CZ: "Czech Republic",
  DK: "Denmark",
  EE: "Estonia",
  FI: "Finland",
  FR: "France",
  DE: "Germany",
  GR: "Greece",
  HU: "Hungary",
  IS: "Iceland",
  IE: "Ireland",
  IT: "Italy",
  LV: "Latvia",
  LT: "Lithuania",
  NL: "Netherlands",
  NO: "Norway",
  PL: "Poland",
  PT: "Portugal",
  RO: "Romania",
  RU: "Russia",
  RS: "Serbia",
  SK: "Slovakia",
  SI: "Slovenia",
  ES: "Spain",
  SE: "Sweden",
  CH: "Switzerland",
  UA: "Ukraine",
  GB: "United Kingdom",
  GE: "Georgia",
  HR: "Croatia",
  ME: "Montenegro",

  // North America
  BS: "Bahamas",
  BB: "Barbados",
  CA: "Canada",
  CR: "Costa Rica",
  CU: "Cuba",
  DO: "Dominican Republic",
  SV: "El Salvador",
  GT: "Guatemala",
  HN: "Honduras",
  JM: "Jamaica",
  MX: "Mexico",
  PA: "Panama",
  PR: "Puerto Rico",
  TT: "Trinidad and Tobago",
  US: "United States",

  // South America
  AR: "Argentina",
  BO: "Bolivia",
  BR: "Brazil",
  CL: "Chile",
  CO: "Colombia",
  EC: "Ecuador",
  PY: "Paraguay",
  PE: "Peru",
  UY: "Uruguay",
  VE: "Venezuela",

  // Oceania
  AU: "Australia",
  FJ: "Fiji",
  NZ: "New Zealand",
  XO: "Multiple Countries (Oceania)",
};

type CountryMapProps = {
  code: string;
  bold?: boolean;
};

const CountryMap = ({ code, bold = false }: CountryMapProps) => {
  const country = countryCodeMapping[code.toUpperCase()] || "Unknown";
  return <Text fontWeight={bold ? "bold" : "normal"}>{country}</Text>;
};

export default CountryMap;
