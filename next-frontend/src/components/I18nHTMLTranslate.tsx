"use client";

import DOMPurify from "dompurify";
import { useT } from "@/lib/i18n/useI18n";

function I18nHTMLTranslate({
  i18nKey,
  options = {},
}: {
  i18nKey: string;
  options?: Record<string, string>;
}) {
  const { t } = useT();

  return (
    <span
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(
          t(i18nKey, { ...options, interpolation: { escapeValue: false } }),
        ),
      }}
    />
  );
}

export default I18nHTMLTranslate;
