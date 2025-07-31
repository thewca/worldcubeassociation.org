"use client";

import { AspectRatio, Container } from "@chakra-ui/react";

export default function Regulations() {
  return (
    <Container>
      <AspectRatio>
        <iframe
          width={"100%"}
          src={`https://regulations.worldcubeassociation.org`}
        ></iframe>
      </AspectRatio>
    </Container>
  );
}
