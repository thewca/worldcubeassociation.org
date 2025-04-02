'use client'

import React from "react";
import {
  Center,
  HStack,
  IconButton,
  Link as ChakraLink,
  Image as ChakraImage,
  VStack
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
    <Center borderTopWidth={3} padding={3} mt={5}>
      <VStack>
        {/* Social Media Icons */}
        <HStack>
          <ChakraLink asChild variant="plainLink">
            <Link
                href="https://instagram.com"
                target="_blank"
            >
              <IconButton variant="ghost">
                <InstagramIcon/>
              </IconButton>
            </Link>
          </ChakraLink>
          <ChakraLink asChild variant="plainLink">
            <Link
                href="https://facebook.com"
                target="_blank"
            >
              <IconButton variant="ghost">
                <FacebookIcon/>
              </IconButton>
            </Link>
          </ChakraLink>
          <ChakraLink asChild variant="plainLink">
            <Link
                href="https://twitter.com"
                target="_blank"
            >
              <IconButton variant="ghost">
                <XIcon/>
              </IconButton>
            </Link>
          </ChakraLink>
          <ChakraLink asChild variant="plainLink">
            <Link
                href="https://github.com"
                target="_blank"
            >
              <IconButton variant="ghost">
                <GitHubIcon/>
              </IconButton>
            </Link>
          </ChakraLink>
          <ChakraLink asChild variant="plainLink">
            <Link
                href="https://youtube.com"
                target="_blank"
            >
              <IconButton variant="ghost">
                <YouTubeIcon/>
              </IconButton>
            </Link>
          </ChakraLink>
        </HStack>

        {/* Footer Links */}
        <HStack gap={5}>
          <ChakraImage asChild>
            <Image src="/logo.png" alt="WCA Logo" height={50} width={50}/>
          </ChakraImage>
          <ChakraLink asChild variant="plainLink">
            <Link href="/about">About Us</Link>
          </ChakraLink>
          <ChakraLink asChild variant="plainLink">
            <Link href="/faqs">FAQs</Link>
          </ChakraLink>
          <ChakraLink asChild variant="plainLink">
            <Link href="/contact">Contact</Link>
          </ChakraLink>
          <ChakraLink asChild variant="plainLink">
            <Link
              href="https://github.com"
              target="_blank"
            >
              GitHub
            </Link>
          </ChakraLink>
          <ChakraLink asChild variant="plainLink">
            <Link href="/privacy">Privacy</Link>
          </ChakraLink>
          <ChakraLink asChild variant="plainLink">
            <Link href="/disclaimer">Disclaimer</Link>
          </ChakraLink>
        </HStack>
      </VStack>

    </Center>
  );
}
