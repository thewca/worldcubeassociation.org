import React from "react";
import {
  Center,
  HStack,
  IconButton,
  Link as ChakraLink,
  Image as ChakraImage,
  Stack,
} from "@chakra-ui/react";
import { getPayload } from "payload";
import config from "@payload-config";
import Link from "next/link";
import Image from "next/image";
import IconDisplay from "@/components/IconDisplay";
import type { IconName } from "@/components/icons/iconMap";
import type { Footer, SocialLink } from "@/types/payload";

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
    <Center borderTop="md" padding={3} mt={5} bg="bg">
      <Stack align="center" gap={5} direction={{ base: "column", lg: "row" }}>
        {navigationLinks.map((item) => (
          <FooterLink key={item.id} item={item} />
        ))}

        <ChakraImage asChild>
          <Image src="/logo.png" alt="WCA Logo" height={50} width={50} />
        </ChakraImage>

        <HStack wrap="wrap">
          {socialLinks.map((item) => (
            <FooterLink key={item.id} item={item} />
          ))}
        </HStack>

        <HStack>
          {legalLinks.map((item) => (
            <FooterLink key={item.id} item={item} />
          ))}
        </HStack>
      </Stack>
    </Center>
  );
}
