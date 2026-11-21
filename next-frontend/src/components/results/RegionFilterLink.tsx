"use client";

import { Link } from "@chakra-ui/react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  getRankingsShow,
  RANKINGS_SHOW,
} from "@/lib/wca/results/rankingsFilters";

export default function RegionFilterLink({
  iso2,
  children,
}: {
  iso2: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const opensRegionalRankings =
    pathname === "/results/rankings" &&
    getRankingsShow(searchParams.get("show")) === RANKINGS_SHOW.byRegion;
  const params = new URLSearchParams([
    ...Array.from(searchParams).filter(
      ([key]) => key !== "region" && (!opensRegionalRankings || key !== "show"),
    ),
    ["region", iso2],
    ...(opensRegionalRankings ? [["show", RANKINGS_SHOW.persons]] : []),
  ]);

  return <Link href={`${pathname}?${params}`}>{children}</Link>;
}
