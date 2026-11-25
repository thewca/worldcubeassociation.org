"use client";

import { Link } from "@chakra-ui/react";
import {
  type ReadonlyURLSearchParams,
  usePathname,
  useSearchParams,
} from "next/navigation";

export default function RegionFilterLink({
  iso2,
  children,
}: {
  iso2: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = getRegionParams(pathname, searchParams, iso2);

  return <Link href={`${pathname}?${params}`}>{children}</Link>;
}

function getRegionParams(
  pathname: string,
  searchParams: ReadonlyURLSearchParams,
  iso2: string,
) {
  const paramsWithRegion = [
    ...Array.from(searchParams).filter(([key]) => key !== "region"),
    ["region", iso2],
  ];
  const isRankingsByRegion =
    pathname === "/results/rankings" &&
    searchParams.get("show") === "by region";

  if (isRankingsByRegion) {
    return new URLSearchParams(
      paramsWithRegion.filter(([key]) => key !== "show"),
    );
  }

  return new URLSearchParams(paramsWithRegion);
}
