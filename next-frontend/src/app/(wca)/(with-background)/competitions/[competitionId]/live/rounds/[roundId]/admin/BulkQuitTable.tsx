"use client";

import { useEffect, useState } from "react";
import { Checkbox, Table } from "@chakra-ui/react";
import { useT } from "@/lib/i18n/useI18n";
import type { LiveCompetitor } from "@/types/live";

export default function BulkQuitTable({
  registrationIds,
  competitors,
  onSelectionChange,
}: {
  registrationIds: number[];
  competitors: Map<number, LiveCompetitor>;
  onSelectionChange: (selectedIds: number[]) => void;
}) {
  const { t } = useT();
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(registrationIds),
  );

  useEffect(() => {
    onSelectionChange([...selected]);
  }, [selected, onSelectionChange]);

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  return (
    <Table.Root size="sm">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader />
          <Table.ColumnHeader>
            {t("competitions.live.admin.quit.bulk.id")}
          </Table.ColumnHeader>
          <Table.ColumnHeader>
            {t("competitions.live.admin.quit.bulk.name")}
          </Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {registrationIds.map((id) => {
          const competitor = competitors.get(id);
          return (
            <Table.Row key={id}>
              <Table.Cell>
                <Checkbox.Root
                  checked={selected.has(id)}
                  onCheckedChange={() => toggle(id)}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                </Checkbox.Root>
              </Table.Cell>
              <Table.Cell>{competitor?.registrant_id}</Table.Cell>
              <Table.Cell>{competitor?.name}</Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
