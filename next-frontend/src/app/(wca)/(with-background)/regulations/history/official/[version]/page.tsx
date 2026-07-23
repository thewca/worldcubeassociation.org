import { AspectRatio, Container } from "@chakra-ui/react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ version: string }>;
}): Promise<Metadata> {
  const { version } = await params;
  return { title: `WCA Regulations ${version}` };
}

export default async function HistoricalRegulation({
  params,
}: {
  params: Promise<{ version: string }>;
}) {
  const { version } = await params;

  return (
    <Container>
      <AspectRatio>
        <iframe
          width="100%"
          src={`https://regulations.worldcubeassociation.org/history/official/${version}`}
        ></iframe>
      </AspectRatio>
    </Container>
  );
}
