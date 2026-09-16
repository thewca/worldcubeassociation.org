import { Link, type LinkProps } from "@chakra-ui/react";

interface RailsLinkProps extends LinkProps {
  href: string;
}

/**
 * A link to a page that is still served by the Rails monolith. It renders a
 * plain anchor so the browser does a full page load — routing it through
 * `next/link` would soft-navigate to a route Next doesn't have.
 *
 * TODO: swap for `next/link` per call site as each target page is migrated.
 */
export default function RailsLink(props: RailsLinkProps) {
  return <Link {...props} />;
}
