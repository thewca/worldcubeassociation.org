import Link from "next/link";
import { Text, TextProps } from "@chakra-ui/react";
import type { RouteLiteral } from "nextjs-routes";

/**
 * A tab's target: a link, unless it points at the page you are already on.
 *
 * Linking to the current page is pointless, and Chakra's tabs machine clicks the selected
 * trigger whenever `value` changes — on an anchor that triggers a full page navigation.
 * See https://github.com/chakra-ui/chakra-ui/issues/11003
 *
 * Every tab trigger whose tabs are links must go through here, or that bug comes back for it.
 */
export default function TabTarget({
  tabKey,
  currentPath,
  href,
  disabled,
  children,
  ...textProps
}: TextProps & {
  tabKey: string;
  currentPath?: string;
  href: RouteLiteral;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const isCurrent = tabKey === currentPath;

  // `textProps` carries the trigger styling `asChild` merged in from `Tabs.Trigger`,
  //   so every branch has to pass it on or the tab renders unstyled.
  if (disabled || isCurrent) {
    return (
      <Text aria-current={isCurrent ? "page" : undefined} {...textProps}>
        {children}
      </Text>
    );
  }

  return (
    <Text asChild {...textProps}>
      <Link href={href}>{children}</Link>
    </Text>
  );
}
