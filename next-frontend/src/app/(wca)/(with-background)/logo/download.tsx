"use client";

import { useState } from "react";
import { Button, Checkbox, Link, VStack } from "@chakra-ui/react";
import { Trans } from "react-i18next";
import { useT } from "@/lib/i18n/useI18n";

export default function LogoDownload({
  logoDownloadLink,
}: {
  logoDownloadLink: string;
}) {
  const [acceptedGuidelines, setAcceptedGuidelines] = useState(false);
  const { t } = useT();

  return (
    <VStack align="left">
      <Checkbox.Root
        checked={acceptedGuidelines}
        onCheckedChange={(e) => setAcceptedGuidelines(!!e.checked)}
      >
        <Checkbox.HiddenInput />
        <Checkbox.Control />
        <Checkbox.Label>
          <Trans
            t={t}
            i18nKey="logo.headings.download_logo_assets.accept_terms_and_conditions"
            components={{ a: <Link /> }}
          />
        </Checkbox.Label>
      </Checkbox.Root>
      <Button disabled={!acceptedGuidelines} asChild>
        <Link href={logoDownloadLink}>
          {t("logo.headings.download_logo_assets.download_button_text")}
        </Link>
      </Button>
    </VStack>
  );
}
