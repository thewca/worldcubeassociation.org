import Link from "next/link";
import { IconButton } from "@chakra-ui/react";
import React from "react";
import WcaLogoIcon from "@/components/icons/WcaLogoIcon";
import { getT } from "@/lib/i18n/get18n";

export default async function WCALogo() {
  const { t } = await getT();

  return (
    <IconButton asChild variant="ghost" aria-label={t("logo.title")}>
      <Link href="/">
        <WcaLogoIcon boxSize={10} color="fg" />
      </Link>
    </IconButton>
  );
}
