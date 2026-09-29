import { Link } from "@chakra-ui/react";
import NextLink from "next/link";
import { searchResultRoute } from "@/lib/wca/search/searchRoutes";
import type { components } from "@/types/openapi";
import type { ReactNode } from "react";

type SearchResult = components["schemas"]["SearchResult"];

export default function SearchResultLink({
  result,
  children,
}: {
  result: SearchResult;
  children: ReactNode;
}) {
  if (result.class === "regulation") {
    return <Link href={result.url}>{children}</Link>;
  }

  return (
    <Link asChild>
      <NextLink href={searchResultRoute(result)}>{children}</NextLink>
    </Link>
  );
}
