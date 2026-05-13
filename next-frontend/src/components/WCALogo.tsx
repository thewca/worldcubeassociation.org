import Link from "next/link";
import { Box, Image as ChakraImage } from "@chakra-ui/react";
import Image from "next/image";
import { IconButton } from "@chakra-ui/react";
import React from "react";

export default function WCALogo() {
  return (
    <IconButton asChild variant="ghost">
      <Link href="/">
        <Box _dark={{ display: "none" }}>
          <ChakraImage asChild maxW={10}>
            <Image src="/logo.png" alt="WCA Logo" height={50} width={50} />
          </ChakraImage>
        </Box>
        <Box display="none" _dark={{ display: "block" }}>
          <ChakraImage asChild maxW={10}>
            <Image src="/logo_dark.png" alt="WCA Logo" height={50} width={50} />
          </ChakraImage>
        </Box>
      </Link>
    </IconButton>
  );
}
