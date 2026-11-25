import { SimpleGrid, Skeleton } from "@chakra-ui/react";
import type { SimpleGridProps, SkeletonProps } from "@chakra-ui/react";
import _ from "lodash";

interface CardGridSkeletonProps extends Omit<
  SimpleGridProps,
  "children" | "columns"
> {
  /** Number of placeholder cards. Ignored when `heights` is provided. */
  count?: number;
  /** Height of every placeholder card. Ignored for entries in `heights`. */
  cardHeight?: SkeletonProps["height"];
  /** One entry per card, to mimic content of varying heights. */
  heights?: SkeletonProps["height"][];
  /** Responsive column definition, same format as Chakra's `SimpleGrid`. */
  columns?: SimpleGridProps["columns"];
}

export default function PageContentSkeleton({
  count = 4,
  cardHeight = "48",
  heights,
  columns = { base: 1, lg: 2 },
  gap = "8",
  ...gridProps
}: CardGridSkeletonProps) {
  const items = heights ?? _.times(count, () => cardHeight);

  return (
    <SimpleGrid columns={columns} gap={gap} {...gridProps}>
      {items.map((height, i) => (
        <Skeleton key={i} height={height} />
      ))}
    </SimpleGrid>
  );
}
