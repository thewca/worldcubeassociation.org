import Link from "next/link";
import { IconButton } from "@chakra-ui/react";
import React from "react";
import WcaLogoIcon from "@/components/icons/WcaLogoIcon";

export default function WCALogo() {
  return (
    <IconButton
      asChild
      variant="ghost"
      // eslint-disable-next-line no-restricted-syntax -- Existing text added before we started enforcing translations
      aria-label="WCA Logo"
    >
      <Link href="/">
        <WcaLogoIcon boxSize={10} color="fg" />
      </Link>
    </IconButton>
  );
}
