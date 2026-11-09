import { Skeleton, Stack, Tabs } from "@chakra-ui/react";
import _ from "lodash";

export default function TabMenuSkeleton() {
  return (
    <Tabs.List width="fit-content" minW="3xs" hideBelow="md" gap="3">
      <Stack width="full" gap="3">
        {_.times(5, (i) => (
          <Skeleton key={i} height="8" />
        ))}
      </Stack>
    </Tabs.List>
  );
}
