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
import availableLocales from "@/lib/staticData/available_locales.json";

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

/** Flatten a Lexical editor value to plain text for read-only display. */
function lexicalText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as Record<string, unknown>;
  let text = typeof n.text === "string" ? n.text : "";
  const children = (n.children ??
    (n.root as Record<string, unknown> | undefined)?.children) as
    | unknown[]
    | undefined;
  if (Array.isArray(children)) {
    for (const child of children) text += lexicalText(child);
  }
  return text;
}

function asText(value: unknown, widget: Widget): string {
  if (value == null) return "";
  return widget === "lexical" ? lexicalText(value) : String(value);
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
  onSaved: (key: string, value: string, status: Status) => void;
}) {
  const editable = item.widget === "plain";
  const [draft, setDraft] = useState(asText(item.target, item.widget));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = editable && draft !== asText(item.target, item.widget);

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
          <Badge colorPalette={item.status === "translated" ? "green" : "gray"}>
            {item.status}
          </Badge>
        </HStack>

        <VStack align="stretch" gap="2">
          <Box>
            <Text fontSize="xs" color="fg.muted">
              Source (English)
            </Text>
            <Text whiteSpace="pre-wrap">
              {asText(item.source, item.widget)}
            </Text>
          </Box>

          {editable ? (
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Translation…"
              autoresize
            />
          ) : (
            <Box>
              <Text fontSize="xs" color="fg.muted">
                Translation (rich text — not yet editable here)
              </Text>
              <Text whiteSpace="pre-wrap" color="fg.muted">
                {asText(item.target, item.widget) || "—"}
              </Text>
            </Box>
          )}

          {error && (
            <Text color="red.fg" fontSize="sm">
              {error}
            </Text>
          )}

          {editable && (
            <HStack justify="end">
              <Button
                size="sm"
                onClick={save}
                loading={saving}
                disabled={!dirty}
              >
                Save
              </Button>
            </HStack>
          )}
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

  const handleSaved = (key: string, value: string, status: Status) => {
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

        <HStack>
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

        {data && !loading && (
          <VStack align="stretch" gap="3">
            {data.items.length === 0 && (
              <Text color="fg.muted">No translatable strings found.</Text>
            )}
            {data.items.map((item) => (
              <StringRow
                key={item.key}
                item={item}
                locale={locale}
                onSaved={handleSaved}
              />
            ))}
          </VStack>
        )}
      </VStack>
    </Container>
  );
}
