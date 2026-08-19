import React from "react";
import {
  Box,
  Center,
  Grid,
  HStack,
  IconButton,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { getPayload } from "payload";
import config from "@payload-config";
import Link from "next/link";
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
          <Box>{item.displayText}</Box>
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

export default async function Footer() {
  const payload = await getPayload({ config });
  const [footer, socialLinksGlobal] = await Promise.all([
    payload.findGlobal({ slug: "footer" }),
    payload.findGlobal({ slug: "social-links" }),
  ]);

  const navigationLinks = footer.navigationLinks ?? [];
  const socialLinks = socialLinksGlobal.links ?? [];
  const legalLinks = footer.legalLinks ?? [];

  return (
    <Box borderTop="md" borderColor="border" mt={5} bg="bg">
      {/* Mobile layout */}
      <Box hideFrom="lg">
        {navigationLinks.map((item) => (
          <Center
            key={item.id}
            bg="bg.subtle"
            py={3}
            borderBottom="1px solid"
            borderColor="border"
          >
            <FooterLink item={item} />
          </Center>
        ))}
        {socialLinks.map((item) => (
          <Center
            key={item.id}
            bg="bg.subtle"
            py={3}
            borderBottom="1px solid"
            borderColor="border"
          >
            <FooterLink item={item} />
          </Center>
        ))}
        <Center bg="bg.subtle" py={4} flexDir="column" gap={2}>
          <WCALogo />
          <HStack>
            {legalLinks.map((item) => (
              <FooterLink key={item.id} item={item} />
            ))}
          </HStack>
        </Center>
      </Box>

      {/* Desktop layout */}
      <Box hideBelow="lg" padding={3}>
        <Grid
          templateColumns="1fr auto 1fr"
          alignItems="center"
          gap={5}
          maxW="breakpoint-xl"
          mx="auto"
        >
          <HStack justify="flex-end" wrap="wrap" gap={5}>
            {navigationLinks.map((item) => (
              <FooterLink key={item.id} item={item} />
            ))}
          </HStack>

          <Center>
            <WCALogo />
          </Center>

          <HStack justify="flex-start">
            {socialLinks.map((item) => (
              <FooterLink key={item.id} item={item} />
            ))}
          </HStack>
        </Grid>

        <Center mt={3}>
          <HStack>
            {legalLinks.map((item) => (
              <FooterLink key={item.id} item={item} />
            ))}
          </HStack>
        </Center>
      </Box>
    </Box>
  );
}
