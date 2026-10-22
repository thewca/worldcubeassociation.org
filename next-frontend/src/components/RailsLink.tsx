import { Link, type LinkProps } from "@chakra-ui/react";

interface RailsLinkProps extends LinkProps {
  /** Root-relative path on the Rails monolith, e.g. `/profile/edit`. */
  href: string;
}

// Rails sits at the root of the public API host.
const RAILS_ROOT_URL = new URL(process.env.NEXT_PUBLIC_WCA_FRONTEND_API_URL!)
  .origin;

/**
 * A link to a page that is still served by the Rails monolith. It renders a
 * plain anchor so the browser does a full page load — routing it through
 * `next/link` would soft-navigate to a route Next doesn't have.
 *
 * TODO: swap for `next/link` per call site as each target page is migrated.
 */
export default function RailsLink({ href, ...props }: RailsLinkProps) {
  return <Link {...props} href={`${RAILS_ROOT_URL}${href}`} />;
}
