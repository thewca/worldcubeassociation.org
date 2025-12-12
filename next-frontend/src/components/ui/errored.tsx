import { Alert } from "@chakra-ui/react";

export default function Errored({ error }: { error: string }) {
  return (
    <Alert.Root>
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>Error fetching Data</Alert.Title>
        <Alert.Description>{error}</Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
}
