"use client";

import React from "react";
import {
  Center,
  HStack,
  IconButton,
  Link as ChakraLink,
  Image as ChakraImage,
  VStack,
} from "@chakra-ui/react";
import InstagramIcon from "@/components/icons/InstagramIcon";
import FacebookIcon from "@/components/icons/FacebookIcon";
import GitHubIcon from "@/components/icons/GithubIcon";
import XIcon from "@/components/icons/XIcon";
import YouTubeIcon from "@/components/icons/YoutubeIcon";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <Center borderTop="md" padding={3} mt={5} bg="bg">
      <VStack>
        {/* Social Media Icons */}
        <HStack>
          <IconButton variant="ghost" asChild>
            <ChakraLink
              textStyle="headerLink"
              href="https://www.instagram.com/thewcaofficial/"
              target="_blank"
            >
              <InstagramIcon />
            </ChakraLink>
          </IconButton>
          <IconButton variant="ghost" asChild>
            <ChakraLink
              textStyle="headerLink"
              href="https://www.facebook.com/WorldCubeAssociation/"
              target="_blank"
            >
              <FacebookIcon />
            </ChakraLink>
          </IconButton>
          <IconButton variant="ghost" asChild>
            <ChakraLink
              textStyle="headerLink"
              href="https://www.twitter.com/theWCAofficial/"
              target="_blank"
            >
              <XIcon />
            </ChakraLink>
          </IconButton>
          <IconButton variant="ghost" asChild>
            <ChakraLink
              textStyle="headerLink"
              href="https://github.com/thewca/worldcubeassociation.org"
              target="_blank"
            >
              <GitHubIcon />
            </ChakraLink>
          </IconButton>
          <IconButton variant="ghost" asChild>
            <ChakraLink
              textStyle="headerLink"
              href="https://www.youtube.com/channel/UC5OUMUnS8PvY1RvtB1pQZ0g"
              target="_blank"
            >
              <YouTubeIcon />
            </ChakraLink>
          </IconButton>
        </HStack>

        {/* Footer Links */}
        <HStack gap={5}>
          <ChakraImage asChild>
            <Image src="/logo.png" alt="WCA Logo" height={50} width={50} />
          </ChakraImage>
          <ChakraLink asChild textStyle="headerLink">
            <Link href="/about">About Us</Link>
          </ChakraLink>
          <ChakraLink asChild textStyle="headerLink">
            <Link href="/faq">FAQs</Link>
          </ChakraLink>
          <ChakraLink
            textStyle="headerLink"
            href="https://worldcubeassociation.org/contact"
          >
            Contact
          </ChakraLink>
          <ChakraLink
            textStyle="headerLink"
            href="https://github.com/thewca"
            target="_blank"
          >
            GitHub
          </ChakraLink>
          <ChakraLink asChild textStyle="headerLink">
            <Link href="/privacy">Privacy</Link>
          </ChakraLink>
          <ChakraLink asChild textStyle="headerLink">
            <Link href="/disclaimer">Disclaimer</Link>
          </ChakraLink>
        </HStack>
      </VStack>
    </Center>
  );
}
