import { AspectRatio, Container } from "@chakra-ui/react";

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
          src={`https://regulations.worldcubeassociation.org/history/official/${version}/index.html`}
        ></iframe>
      </AspectRatio>
    </Container>
  );
}
