"use client";

import {
  Avatar,
  Combobox,
  createListCollection,
  Portal,
  useFilter,
} from "@chakra-ui/react";
import { useState } from "react";
import { TFunction } from "i18next";
import useAPI from "@/lib/wca/useAPI";
import { toAvatarName } from "@/lib/utils";

export default function DelegateSelector({
  delegateId,
  onDelegateChange,
  t,
}: {
  delegateId?: number;
  onDelegateChange: (delegateId?: number) => void;
  t: TFunction;
}) {
  const api = useAPI();
  const { contains } = useFilter({ sensitivity: "base" });
  const [inputValue, setInputValue] = useState("");

  const { data: delegates = [], isPending } = api.useQuery(
    "get",
    "/v0/delegates/search-index",
  );

  const delegateItems = delegates.map((delegate) => ({
    value: delegate.id.toString(),
    label: delegate.wca_id
      ? `${delegate.name} (${delegate.wca_id})`
      : delegate.name,
    thumbUrl: delegate.thumb_url,
  }));

  const collection = createListCollection({
    items: delegateItems.filter((item) => contains(item.label, inputValue)),
  });

  return (
    <Combobox.Root
      lazyMount
      collection={collection}
      value={delegateId ? [delegateId.toString()] : []}
      onValueChange={(e) =>
        onDelegateChange(e.value[0] ? Number(e.value[0]) : undefined)
      }
      onInputValueChange={(e) => setInputValue(e.inputValue)}
      inputBehavior="autohighlight"
      openOnClick
      width={{ base: "full", md: "sm" }}
    >
      <Combobox.Label>{t("layouts.navigation.delegate")}</Combobox.Label>
      <Combobox.Control>
        <Combobox.Input placeholder={t("competitions.index.no_delegates")} />
        <Combobox.IndicatorGroup>
          <Combobox.ClearTrigger />
          <Combobox.Trigger />
        </Combobox.IndicatorGroup>
      </Combobox.Control>
      <Portal>
        <Combobox.Positioner>
          <Combobox.Content>
            <Combobox.Empty>
              {isPending
                ? t("competitions.index.delegates_loading")
                : t("competitions.index.no_delegates_found")}
            </Combobox.Empty>
            {collection.items.map((item) => (
              <Combobox.Item item={item} key={item.value}>
                <Avatar.Root size="2xs">
                  <Avatar.Fallback name={toAvatarName(item.label)} />
                  <Avatar.Image src={item.thumbUrl} />
                </Avatar.Root>
                {item.label}
                <Combobox.ItemIndicator />
              </Combobox.Item>
            ))}
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
  );
}
