"use client";

import { Link } from "@chakra-ui/react";
import { Trans } from "react-i18next";
import { useT } from "@/lib/i18n/useI18n";

// `Trans` clones the element it is handed to attach the href and text from the translation
//   string. In a Server Component, Chakra's Link is a client reference rather than the real
//   component, so React refuses to render the clone and the failed render surfaces as an
//   uncaught `TypeError: Cannot read properties of undefined (reading 'stack')`. Cloning here,
//   on the client, hands `Trans` the real component.
export default function TransWithLinks({
  i18nKey,
  values,
}: {
  i18nKey: string;
  values?: Record<string, string>;
}) {
  const { t } = useT();

  return (
    <Trans
      t={t}
      i18nKey={i18nKey}
      values={values}
      components={{ a: <Link /> }}
    />
  );
}
