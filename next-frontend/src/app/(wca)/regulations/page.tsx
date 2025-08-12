import { AspectRatio, Container } from "@chakra-ui/react";

export default async function Regulations() {
  return (
    <Container bg="bg">
      <AspectRatio>
        <iframe
          width="100%"
          src="https://regulations.worldcubeassociation.org"
          style={{ border: "none", background: "transparent" }}
        ></iframe>
      </AspectRatio>
    </Container>
  );
}
