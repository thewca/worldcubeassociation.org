"use client";

import { Link } from "@chakra-ui/react";
import { Trans } from "react-i18next";
import DisclaimerDialog from "@/components/DisclaimerDialog";
import { useT } from "@/lib/i18n/useI18n";

const BETA_DISCLAIMER_COOKIE = "beta_disclaimer_accepted";

export default function BetaDisclaimer() {
  const { t } = useT();

  return (
    <DisclaimerDialog
      cookieName={BETA_DISCLAIMER_COOKIE}
      title={t("beta_disclaimer.title")}
      acceptLabel={t("beta_disclaimer.accept")}
    >
      <Trans
        t={t}
        i18nKey="beta_disclaimer.description_html"
        components={{
          a: (
            <Link
              href="https://docs.google.com/forms/d/e/1FAIpQLSfBIy3E8cpqa6QTg9SG5r6ELyV1FhNMF89fwxPrr1aafgw2Ig/viewform"
              textStyle="s2"
            />
          ),
        }}
      />
    </DisclaimerDialog>
  );
}
