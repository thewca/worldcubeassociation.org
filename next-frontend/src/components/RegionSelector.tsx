import {
  Combobox,
  Portal,
  Text,
  useFilter,
  useListCollection,
  VStack,
} from "@chakra-ui/react";
import Flag from "react-world-flags";
import countries from "@/lib/wca/data/countries";
import { TFunction } from "i18next";

interface RegionSelectorProps {
  onlyCountries?: boolean;
  label?: string;
  region?: string;
  onRegionChange: (region: string) => void;
  nullable?: boolean;
  disabled?: boolean;
  error?: string;
  name?: string;
  t: TFunction;
}

export const ALL_REGIONS_VALUE = "all";

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

  const items = onlyCountries
    ? countries.real
    : Object.values(countries.byIso2);

  const { collection, filter } = useListCollection({
    initialItems: items.map(({ iso2, id }) => ({
      label: t(`countries.${iso2}`),
      value: id,
    })),
    filter: contains,
  });

  return (
    <VStack alignItems="start">
      {label && <Text textStyle="label">{label}</Text>}
      <Combobox.Root
        collection={collection}
        onInputValueChange={(e) => filter(e.inputValue)}
        onValueChange={(e) => onRegionChange(e.value[0])}
        width="100%"
        colorPalette="blue"
        openOnClick
        disabled={disabled}
        defaultValue={region ? [region] : []}
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
                <Combobox.Item item={item} key={item.value}>
                  <Flag
                    code={countries.byId[item.value].iso2}
                    fallback={item.value}
                    height="25"
                    width="32"
                  />
                  {item.label}
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
