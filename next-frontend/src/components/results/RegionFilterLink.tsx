"use client";

import { Link } from "@chakra-ui/react";
import { usePathname, useSearchParams } from "next/navigation";

export default function RegionFilterLink({
  iso2,
  children,
}: {
  iso2: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = new URLSearchParams(searchParams);
  params.set("region", iso2);

  return <Link href={`${pathname}?${params}`}>{children}</Link>;
}
