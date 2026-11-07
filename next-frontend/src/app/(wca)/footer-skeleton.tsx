import { Center, Skeleton } from "@chakra-ui/react";

export default function FooterSkeleton() {
  return (
    <Center borderTop="md" borderColor="border" padding={3} mt={5} bg="bg">
      <Skeleton height="10" width="full" maxW="3xl" />
    </Center>
  );
}
