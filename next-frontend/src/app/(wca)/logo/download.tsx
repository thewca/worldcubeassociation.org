"use client";

import I18nHTMLTranslate from "@/components/I18nHTMLTranslate";
import { useState } from "react";
import { Button, Checkbox, Link, VStack } from "@chakra-ui/react";

export default function LogoDownload({
  logoDownloadLink,
}: {
  logoDownloadLink: string;
}) {
  const [acceptedGuidelines, setAcceptedGuidelines] = useState(false);

  return (
    <VStack align="left">
      <Checkbox.Root
        checked={acceptedGuidelines}
        onCheckedChange={(e) => setAcceptedGuidelines(!!e.checked)}
      >
        <Checkbox.HiddenInput />
        <Checkbox.Control />
        <Checkbox.Label>
          <I18nHTMLTranslate i18nKey="logo.headings.download_logo_assets.accept_terms_and_conditions" />
        </Checkbox.Label>
      </Checkbox.Root>
      <Button disabled={!acceptedGuidelines} asChild>
        <Link href={logoDownloadLink}>
          <I18nHTMLTranslate i18nKey="logo.headings.download_logo_assets.download_button_text" />
        </Link>
      </Button>
    </VStack>
  );
}
