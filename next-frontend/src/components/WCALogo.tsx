"use client";

import Link from "next/link";
import { Image as ChakraImage } from "@chakra-ui/react";
import Image from "next/image";
import { IconButton } from "@chakra-ui/react";
import React from "react";
import { useColorModeValue } from "@/components/ui/color-mode";

export default function WCALogo() {
  const { src, alt } = useColorModeValue(
    { src: "/logo.png", alt: "Wca Logo Light" },
    { src: "/logo_dark.png", alt: "Wca Logo Dark" },
  );

  return (
    <IconButton asChild variant="ghost">
      <Link href="/">
        <ChakraImage asChild maxW={10}>
          <Image src={src} alt={alt} height={50} width={50} />
        </ChakraImage>
      </Link>
    </IconButton>
  );
}
