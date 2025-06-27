"use client";

import { useParams } from "next/navigation";
import { AspectRatio, Container } from "@chakra-ui/react";

export default function HistoricalRegulation() {
  const params = useParams<{ version: string }>();

  return (
    <Container>
      <AspectRatio>
        <iframe
          width={"100%"}
          src={`http://regulations.worldcubeassociation.org/history/official/${params.version}/index.html`}
        ></iframe>
      </AspectRatio>
    </Container>
  );
}
