import Link from "next/link";
import { IconButton } from "@chakra-ui/react";
import React from "react";
import WcaLogoIcon from "@/components/icons/WcaLogoIcon";

export default function WCALogo() {
  return (
    <IconButton asChild variant="ghost" aria-label="WCA Logo">
      <Link href="/">
        <WcaLogoIcon boxSize={10} color="fg" />
      </Link>
    </IconButton>
  );
}
