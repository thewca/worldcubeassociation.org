import { useState } from "react";
import { useOnInView } from "react-intersection-observer";

// Grows the observed area upwards, so the top sentinel only counts as out of
// view once the reader has scrolled a screenful or so past it.
const BACK_TO_TOP_ROOT_MARGIN_DEFAULT = "400px 0px 0px 0px";

export default function useIsScrolled({
  scrollThreshold,
}: { scrollThreshold?: string } = {}) {
  const rootMargin = scrollThreshold || BACK_TO_TOP_ROOT_MARGIN_DEFAULT;
  const [isScrolledDown, setIsScrolledDown] = useState(false);

  const topSentinelRef = useOnInView((inView) => setIsScrolledDown(!inView), {
    rootMargin,
  });

  return { isScrolledDown, topSentinelRef };
}
