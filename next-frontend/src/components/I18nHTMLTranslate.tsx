"use client";

import DOMPurify from "dompurify";
import { useT } from "@/lib/i18n/useI18n";

import type { ElementType } from "react";

function I18nHTMLTranslate({
  i18nKey,
  options = {},
  as: RenderAs = "span",
}: {
  i18nKey: string;
  options?: Record<string, string>;
  as?: ElementType;
}) {
  const { t } = useT();

  return (
    <RenderAs
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(
          t(i18nKey, { ...options, interpolation: { escapeValue: false } }),
        ),
      }}
    />
  );
}

export default I18nHTMLTranslate;
