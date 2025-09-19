import {
  Combobox,
  Heading,
  Portal,
  Text,
  useFilter,
  useListCollection,
  VStack,
} from "@chakra-ui/react";
import Flag from "react-world-flags";
import countries from "@/lib/wca/data/countries";
import { TFunction } from "i18next";
import continents from "@/lib/wca/data/continents";
import { JSX } from "react";

interface RegionSelectorProps {
  onlyCountries?: boolean;
  label: string;
  region?: string;
  onRegionChange: (region: string) => void;
  nullable?: boolean;
  disabled?: boolean;
  error?: string;
  name?: string;
  t: TFunction;
}

export const ALL_REGIONS_VALUE = "all";

type RegionSelectorOption = {
  key: string;
  label: string;
  value: string;
  disabled?: boolean;
  flag?: JSX.Element;
  content?: JSX.Element;
};

const allRegionsOption = (t: TFunction) => ({
  key: "all",
  label: t("common.all_regions"),
  value: ALL_REGIONS_VALUE,
});

const continentOptions = (t: TFunction) =>
  Object.values(continents.real)
    .toSorted((a, b) =>
      t(`continents.${a.id}`).localeCompare(t(`continents.${b.id}`)),
    )
    .map((continent) => ({
      key: continent.id,
      label: t(`continents.${continent.name}`),
      value: continent.id,
    }));

const countryOptions = (t: TFunction) =>
  Object.values(countries.real)
    .toSorted((a, b) =>
      t(`countries.${a.iso2}`).localeCompare(t(`countries.${b.iso2}`)),
    )
    .map((country) => ({
      key: country.id,
      label: t(`countries.${country.iso2}`),
      flag: (
        <Flag
          code={country.iso2}
          fallback={country.id}
          width={32}
          height={25}
        />
      ),
      value: country.iso2,
    }));

const regionsOptions = (t: TFunction) =>
  [
    allRegionsOption(t),
    {
      key: "continents_header",
      label: "",
      disabled: true,
      content: (
        <Heading size="sm" textAlign="center">
          {t("common.continent")}
        </Heading>
      ),
    },
    ...continentOptions(t),
    {
      key: "countries_header",
      label: "",
      disabled: true,
      content: (
        <Heading size="sm" textAlign="center">
          {t("common.country")}
        </Heading>
      ),
    },
    ...countryOptions(t),
  ] as RegionSelectorOption[];

export default function RegionSelector({
  onlyCountries = false,
  label,
  region,
  onRegionChange,
  nullable = false,
  disabled = false,
  error = undefined,
  name,
  t,
}: RegionSelectorProps) {
  const { contains } = useFilter({ sensitivity: "base" });

  const items: RegionSelectorOption[] = onlyCountries
    ? countryOptions(t)
    : regionsOptions(t);

  const { collection, filter } = useListCollection({
    initialItems: items,
    filter: contains,
  });

  return (
    <VStack alignItems="start">
      <Text textStyle="label">{label}</Text>
      <Combobox.Root
        collection={collection}
        onInputValueChange={(e) => filter(e.inputValue)}
        onValueChange={(e) => onRegionChange(e.value[0])}
        width="100%"
        colorPalette="blue"
        openOnClick
        value={region ? [region] : undefined}
        disabled={disabled}
        defaultValue={[ALL_REGIONS_VALUE]}
        invalid={error !== undefined}
        selectionBehavior={nullable ? "clear" : "replace"}
      >
        <Combobox.Control>
          <Combobox.Input placeholder={name} />
          <Combobox.IndicatorGroup>
            <Combobox.ClearTrigger />
            <Combobox.Trigger />
          </Combobox.IndicatorGroup>
        </Combobox.Control>
        <Portal>
          <Combobox.Positioner>
            <Combobox.Content justifyContent="flex-start">
              <Combobox.Empty>No items found</Combobox.Empty>
              {collection.items.map((item) => (
                <Combobox.Item item={item} key={item.key}>
                  {item.flag}
                  {item.content ? item.content : item.label}
                  <Combobox.ItemIndicator />
                </Combobox.Item>
              ))}
            </Combobox.Content>
          </Combobox.Positioner>
        </Portal>
      </Combobox.Root>
    </VStack>
  );
}
