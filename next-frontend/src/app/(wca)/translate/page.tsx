"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Heading,
  HStack,
  NativeSelect,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import type { SerializedEditorState } from "lexical";
import availableLocales from "@/lib/staticData/available_locales.json";
import RichTextEditor from "./RichTextEditor";

type Status = "translated" | "untranslated";
type Widget = "plain" | "lexical";

interface StringItem {
  key: string;
  pathString: string;
  widget: Widget;
  parentType: "collection" | "global";
  parentSlug: string;
  docId: string | null;
  dataPath: (string | number)[];
  source: unknown;
  target: unknown;
  status: Status;
}

interface StringsResponse {
  locale: string;
  sourceLocale: string;
  progress: { total: number; translated: number; percent: number };
  items: StringItem[];
}

const localeOptions = Object.entries(availableLocales)
  .filter(([code]) => code !== "en")
  .map(([code, { name }]) => ({ code, name }));

// Plain fields are strings; richText fields are raw Lexical JSON edited via the
// WYSIWYG editor.
function asText(value: unknown): string {
  return value == null ? "" : String(value);
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <Box w="full" h="2" bg="gray.muted" borderRadius="full" overflow="hidden">
      <Box
        h="full"
        w={`${percent}%`}
        bg="green.solid"
        transition="width 0.2s"
      />
    </Box>
  );
}

function StringRow({
  item,
  locale,
  onSaved,
}: {
  item: StringItem;
  locale: string;
  onSaved: (key: string, value: unknown, status: Status) => void;
}) {
  const lexical = item.widget === "lexical";
  // draft holds a string for plain fields, Lexical JSON for richText.
  const [draft, setDraft] = useState<unknown>(item.target ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = lexical
    ? JSON.stringify(draft) !== JSON.stringify(item.target ?? null)
    : draft !== asText(item.target);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/translate/strings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          parentType: item.parentType,
          parentSlug: item.parentSlug,
          docId: item.docId,
          dataPath: item.dataPath,
          value: draft,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      onSaved(item.key, draft, json.status as Status);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card.Root size="sm" w="full">
      <Card.Body>
        <HStack justify="space-between" align="start" mb="2">
          <Text fontSize="xs" color="fg.muted" fontFamily="mono">
            {item.pathString}
          </Text>
          <HStack gap="2">
            {lexical && <Badge colorPalette="purple">Rich text</Badge>}
            <Badge
              colorPalette={item.status === "translated" ? "green" : "gray"}
            >
              {item.status}
            </Badge>
          </HStack>
        </HStack>

        <VStack align="stretch" gap="2">
          <Box>
            <Text fontSize="xs" color="fg.muted">
              Source (English)
            </Text>
            {lexical ? (
              <RichTextEditor
                value={(item.source as SerializedEditorState) ?? null}
                editable={false}
              />
            ) : (
              <Text whiteSpace="pre-wrap">{asText(item.source)}</Text>
            )}
          </Box>

          {lexical ? (
            <RichTextEditor
              value={(item.target as SerializedEditorState) ?? null}
              onChange={setDraft}
            />
          ) : (
            <Textarea
              value={asText(draft)}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Translation…"
              autoresize
            />
          )}

          {error && (
            <Text color="red.fg" fontSize="sm">
              {error}
            </Text>
          )}

          <HStack justify="end">
            <Button size="sm" onClick={save} loading={saving} disabled={!dirty}>
              Save
            </Button>
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

export default function TranslatePage() {
  const [locale, setLocale] = useState(localeOptions[0]?.code ?? "");
  const [data, setData] = useState<StringsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTranslated, setShowTranslated] = useState(false);

  const load = useCallback(async (target: string) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(
        `/api/translate/strings?locale=${encodeURIComponent(target)}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load strings");
      setData(json as StringsResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load strings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (locale) load(locale);
  }, [locale, load]);

  const handleSaved = (key: string, value: unknown, status: Status) => {
    setData((prev) => {
      if (!prev) return prev;
      const items = prev.items.map((it) =>
        it.key === key ? { ...it, target: value, status } : it,
      );
      const translated = items.filter((i) => i.status === "translated").length;
      return {
        ...prev,
        items,
        progress: {
          total: items.length,
          translated,
          percent: items.length
            ? Math.round((translated / items.length) * 100)
            : 100,
        },
      };
    });
  };

  return (
    <Container maxW="4xl" py="6">
      <VStack align="stretch" gap="4">
        <Heading size="xl">Translations</Heading>

        <HStack justify="space-between">
          <NativeSelect.Root width="xs">
            <NativeSelect.Field
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
            >
              {localeOptions.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.name}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowTranslated((s) => !s)}
          >
            {showTranslated ? "Hide translated" : "Show translated"}
          </Button>
        </HStack>

        {data && (
          <Box>
            <HStack justify="space-between" mb="1">
              <Text fontSize="sm" color="fg.muted">
                Progress
              </Text>
              <Text fontSize="sm" color="fg.muted">
                {data.progress.translated} / {data.progress.total} (
                {data.progress.percent}%)
              </Text>
            </HStack>
            <ProgressBar percent={data.progress.percent} />
          </Box>
        )}

        {loading && (
          <HStack justify="center" py="10">
            <Spinner />
          </HStack>
        )}

        {error && (
          <Card.Root>
            <Card.Body>
              <Text color="red.fg">{error}</Text>
            </Card.Body>
          </Card.Root>
        )}

        {data &&
          !loading &&
          (() => {
            const visible = showTranslated
              ? data.items
              : data.items.filter((i) => i.status === "untranslated");

            // Group by parent doc, preserving first-seen order.
            const groups = new Map<string, StringItem[]>();
            for (const item of visible) {
              const key = `${item.parentType}:${item.parentSlug}`;
              (groups.get(key) ?? groups.set(key, []).get(key)!).push(item);
            }

            if (visible.length === 0) {
              return (
                <Text color="fg.muted">
                  {data.items.length === 0
                    ? "No translatable strings found."
                    : "Everything is translated. 🎉"}
                </Text>
              );
            }

            return (
              <VStack align="stretch" gap="6">
                {[...groups].map(([key, items]) => (
                  <VStack key={key} align="stretch" gap="3">
                    <Heading size="md" textTransform="capitalize">
                      {items[0].parentSlug}
                    </Heading>
                    {items.map((item) => (
                      <StringRow
                        key={item.key}
                        item={item}
                        locale={locale}
                        onSaved={handleSaved}
                      />
                    ))}
                  </VStack>
                ))}
              </VStack>
            );
          })()}
      </VStack>
    </Container>
  );
}
