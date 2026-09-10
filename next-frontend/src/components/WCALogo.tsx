import Link from "next/link";
import { Image as ChakraImage } from "@chakra-ui/react";
import Image from "next/image";
import { IconButton } from "@chakra-ui/react";
import React from "react";

export default function WCALogo() {
  return (
    <IconButton asChild variant="ghost">
      <Link href="/">
        {/* Both logos are rendered and toggled by CSS: picking one from the color
            mode at render time mismatches between server and client. */}
        <ChakraImage asChild maxW={10} _dark={{ display: "none" }}>
          <Image src="/logo.png" alt="WCA Logo" height={50} width={50} />
        </ChakraImage>
        <ChakraImage
          asChild
          maxW={10}
          display="none"
          _dark={{ display: "block" }}
        >
          <Image src="/logo_dark.png" alt="WCA Logo" height={50} width={50} />
        </ChakraImage>
      </Link>
    </IconButton>
  );
}
