"use client";

import { useParams } from "next/navigation";
import { AspectRatio, Container } from "@chakra-ui/react";

export default function TranslatedRegulations() {
  const params = useParams<{ language: string }>();

  return (
    <Container>
      <AspectRatio>
        <iframe
          width={"100%"}
          src={`https://regulations.worldcubeassociation.org/translations/${params.language}`}
        ></iframe>
      </AspectRatio>
    </Container>
  );
}
