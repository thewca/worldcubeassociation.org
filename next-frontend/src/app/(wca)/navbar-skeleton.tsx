import { Box, HStack, Skeleton } from "@chakra-ui/react";

export default function NavbarSkeleton() {
  return (
    <Box borderBottom="md" borderColor="border" bg="bg">
      <HStack padding="3" justifyContent="space-between">
        <Skeleton height="8" width="3xs" />
        <Skeleton height="8" flex="1" mx="4" />
        <Skeleton height="8" width="4xs" />
      </HStack>
    </Box>
  );
}
