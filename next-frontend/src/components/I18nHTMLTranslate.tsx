import DOMPurify from "dompurify";
import { useT } from "@/lib/i18n/useI18n";

function I18nHTMLTranslate({
  i18nKey,
  options = {},
}: {
  i18nKey: string;
  options?: Record<string, string>;
}) {
  const I18n = useT();

  return (
    <span
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(I18n.t(i18nKey, options)),
      }}
    />
  );
}

export default I18nHTMLTranslate;
