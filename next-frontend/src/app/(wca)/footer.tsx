import React, { Suspense, cache } from "react";
import {
  Center,
  HStack,
  IconButton,
  Link as ChakraLink,
  Stack,
} from "@chakra-ui/react";
import { getPayload } from "payload";
import config from "@payload-config";
import Link from "next/link";
import { connection } from "next/server";
import IconDisplay from "@/components/IconDisplay";
import type { IconName } from "@/components/icons/iconMap";
import type { Footer, SocialLink } from "@/types/payload";
import WCALogo from "@/components/WCALogo";

type FooterNavItem = NonNullable<Footer["navigationLinks"]>[number];
type FooterSocialItem = NonNullable<SocialLink["links"]>[number];

function FooterLink({ item }: { item: FooterNavItem | FooterSocialItem }) {
  if (item.blockType === "FooterLinkItem") {
    return (
      <ChakraLink asChild textStyle="headerLink">
        <Link href={item.targetLink}>{item.displayText}</Link>
      </ChakraLink>
    );
  }
  if (item.blockType === "SocialLinkItem") {
    return (
      <IconButton variant="ghost" asChild>
        <ChakraLink
          textStyle="headerLink"
          href={item.targetLink}
          target="_blank"
          aria-label={item.displayText}
        >
          <IconDisplay name={item.displayIcon as IconName} />
        </ChakraLink>
      </IconButton>
    );
  }
  return (
    <ChakraLink textStyle="headerLink" href={item.targetLink} target="_blank">
      {item.displayText}
    </ChakraLink>
  );
}

// `connection()` has to come before the Payload queries: it defers everything below it to request
// time, so the build-time prerender stops here instead of trying to reach MongoDB, which is not
// available while building. `cache` keeps the three consumers below down to one round trip.
const getFooterData = cache(async () => {
  await connection();

  const payload = await getPayload({ config });
  const [footer, socialLinksGlobal] = await Promise.all([
    payload.findGlobal({ slug: "footer" }),
    payload.findGlobal({ slug: "social-links" }),
  ]);

  return {
    navigationLinks: footer.navigationLinks ?? [],
    socialLinks: socialLinksGlobal.links ?? [],
    legalLinks: footer.legalLinks ?? [],
  };
});

async function FooterNavigationLinks() {
  const { navigationLinks } = await getFooterData();

  return navigationLinks.map((item) => (
    <FooterLink key={item.id} item={item} />
  ));
}

async function FooterSocialLinks() {
  const { socialLinks } = await getFooterData();

  return socialLinks.map((item) => <FooterLink key={item.id} item={item} />);
}

async function FooterLegalLinks() {
  const { legalLinks } = await getFooterData();

  return legalLinks.map((item) => <FooterLink key={item.id} item={item} />);
}

export default function Footer() {
  return (
    <Center borderTop="md" borderColor="border" padding={3} mt={5} bg="bg">
      <Stack align="center" gap={5} direction={{ base: "column", lg: "row" }}>
        <Suspense fallback={null}>
          <FooterNavigationLinks />
        </Suspense>

        <WCALogo />

        <HStack wrap="wrap">
          <Suspense fallback={null}>
            <FooterSocialLinks />
          </Suspense>
        </HStack>

        <HStack>
          <Suspense fallback={null}>
            <FooterLegalLinks />
          </Suspense>
        </HStack>
      </Stack>
    </Center>
  );
}
