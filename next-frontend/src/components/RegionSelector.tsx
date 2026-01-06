import {
  Combobox,
  Field,
  Heading,
  Portal,
  useFilter,
  useListCollection,
} from "@chakra-ui/react";
import WcaFlag from "@/components/WcaFlag";
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
  centered?: boolean;
};

const allRegionsOption = (t: TFunction) => ({
  key: "all",
  label: t("common.all_regions"),
  value: ALL_REGIONS_VALUE,
});

const continentOptions = (t: TFunction) =>
  Object.values(continents.real)
    .map((continent) => ({
      key: continent.id,
      label: t(`continents.${continent.name}`),
      value: continent.id,
    }))
    .toSorted((a, b) => a.label.localeCompare(b.label));

const countryOptions = (t: TFunction) =>
  Object.values(countries.real)
    .map((country) => ({
      key: country.id,
      label: t(`countries.${country.iso2}`),
      flag: (
        <WcaFlag
          code={country.iso2}
          fallback={country.id}
          width={32}
          height={25}
        />
      ),
      value: country.iso2,
    }))
    .toSorted((a, b) => a.label.localeCompare(b.label));

const regionsOptions = (t: TFunction) =>
  [
    allRegionsOption(t),
    {
      key: "continents_header",
      label: "",
      disabled: true,
      centered: true,
      content: (
        <Heading textStyle="s4" fontSize="sm">
          {t("common.continent")}
        </Heading>
      ),
    },
    ...continentOptions(t),
    {
      key: "countries_header",
      label: "",
      disabled: true,
      centered: true,
      content: (
        <Heading textStyle="s4" fontSize="sm">
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
    <Field.Root alignItems="start">
      <Field.Label textStyle="label">{label}</Field.Label>
      <Combobox.Root
        collection={collection}
        onInputValueChange={(e) => filter(e.inputValue)}
        onValueChange={(e) => onRegionChange(e.value[0])}
        width="100%"
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
            <Combobox.Content>
              <Combobox.Empty>No items found</Combobox.Empty>
              {collection.items.map((item) => (
                <Combobox.Item item={item} key={item.key} justifyContent={item.centered ? "center" : "start"}>
                  {item.flag}
                  {item.content ?? item.label}
                  <Combobox.ItemIndicator />
                </Combobox.Item>
              ))}
            </Combobox.Content>
          </Combobox.Positioner>
        </Portal>
      </Combobox.Root>
    </Field.Root>
  );
}
