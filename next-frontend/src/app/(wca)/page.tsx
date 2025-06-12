"use server";

import React from "react";
import {
  SimpleGrid,
  GridItem,
  Button,
  Card,
  Separator,
  Box,
  Image,
  Heading,
  Text,
  Tabs,
  Badge,
  VStack,
  Link as ChakraLink,
  Center,
} from "@chakra-ui/react";
import AnnouncementsCard from "@/components/AnnouncementsCard";
import { getPayload } from "payload";
import config from "@payload-config";

import CompRegoCloseDateIcon from "@/components/icons/CompRegoCloseDateIcon";
import CompetitorsIcon from "@/components/icons/CompetitorsIcon";
import RegisterIcon from "@/components/icons/RegisterIcon";
import LocationIcon from "@/components/icons/LocationIcon";

import Flag from "react-world-flags";
import CountryMap from "@/components/CountryMap";

import type {
  TextCardBlock,
  FeaturedCompetitionsBlock,
  FullWidthBlock,
  ImageBannerBlock,
  ImageOnlyCardBlock,
  Media,
  TestimonialsBlock,
  TwoBlocksBlock,
  TwoBlocksBranchBlock,
  TwoBlocksLeafBlock,
  ColorSelect,
  Testimonial,
  AnnouncementsSectionBlock,
  Announcement,
  User,
} from "@/payload-types";
import Link from "next/link";

const colorMap: Record<ColorSelect, string> = {
  blue: "blue.50",
  red: "red.50",
  green: "green.50",
  orange: "orange.50",
  yellow: "yellow.50",
  darkBlue: "blue.100",
  darkRed: "red.100",
  darkGreen: "green.100",
  darkOrange: "orange.100",
  darkYellow: "yellow.100",
  white: "supplementary.texts.light",
  black: "supplementary.texts.dark",
};

const colorGradientMap: Record<ColorSelect, string> = {
  blue: "blue-50",
  red: "red-50",
  green: "green-50",
  orange: "orange-50",
  yellow: "yellow-50",
  darkBlue: "blue-100",
  darkRed: "red-100",
  darkGreen: "green-100",
  darkOrange: "orange-100",
  darkYellow: "yellow-100",
  white: "white-100",
  black: "black-100",
};

const TextCard = ({ block }: { block: TextCardBlock }) => {
  return (
    <Card.Root
      variant={block.variant}
      size="lg"
      colorPalette={block.colorPalette}
      width="full"
    >
      {block.headerImage && (
        <Image
          src={(block.headerImage as Media).url ?? undefined}
          alt={(block.headerImage as Media).alt ?? undefined}
          aspectRatio="3/1"
        />
      )}
      <Card.Body>
        <Card.Title>{block.heading}</Card.Title>
        {block.separatorAfterHeading && <Separator size="md" />}
        <Card.Description>{block.body}</Card.Description>
        {block.buttonText?.trim() && (
          <Button mr="auto" asChild>
            <ChakraLink asChild>
              <Link href={block.buttonLink!}>{block.buttonText}</Link>
            </ChakraLink>
          </Button>
        )}
      </Card.Body>
    </Card.Root>
  );
};

const AnnouncementsSection = ({
  block,
}: {
  block: AnnouncementsSectionBlock;
}) => {
  const mainAnnouncement = block.mainAnnouncement as Announcement;

  return (
    <AnnouncementsCard
      hero={{
        title: mainAnnouncement.title,
        postedBy: (mainAnnouncement.publishedBy as User).name!,
        postedAt: mainAnnouncement.publishedAt,
        markdown: mainAnnouncement.contentMarkdown!,
        fullLink: `/articles/${mainAnnouncement.id}`,
      }}
      others={block
        .furtherAnnouncements!.map(
          (announcement) => announcement as Announcement,
        )
        .map((announcement) => ({
          title: announcement.title,
          href: `/articles/${announcement.id}`,
        }))}
    />
  );
};

const ImageBanner = ({ block }: { block: ImageBannerBlock }) => {
  return (
    <Card.Root
      variant="info"
      flexDirection="row"
      overflow="hidden"
      colorPalette={block.colorPalette}
      size="lg"
    >
      <Box position="relative" flex="1" minW="50%" maxW="50%" overflow="hidden">
        <Image
          src={(block.mainImage as Media).url ?? undefined}
          alt={(block.mainImage as Media).alt ?? undefined}
          objectFit="cover"
          width="100%"
          height="40vh"
          bg={colorMap[block.bgColor]}
        />
        {/* Blue Gradient Overlay */}
        <Box
          position="absolute"
          top="0"
          right="0"
          bottom="0"
          left="50%"
          style={{
            backgroundImage: `linear-gradient(to right, transparent, var(--chakra-colors-${colorGradientMap[block.bgColor]}))`,
          }}
          zIndex="1"
        />
      </Box>

      <Card.Body
        flex="1"
        zIndex="2"
        color="white"
        p="8"
        bg={colorMap[block.bgColor]}
        justifyContent="center"
        pr="15%"
        backgroundImage={
          block.bgImage != null
            ? `url('${(block.bgImage as Media).url}')`
            : undefined
        }
        backgroundSize={block.bgSize != null ? `${block.bgSize}%` : undefined}
        backgroundPosition={block.bgPos ?? undefined}
        backgroundRepeat="no-repeat"
      >
        <Heading
          size="4xl"
          color={colorMap[block.headingColor]}
          mb="4"
          textTransform="uppercase"
        >
          {block.heading}
        </Heading>
        <Text fontSize="md" color={colorMap[block.textColor]}>
          {block.body}
        </Text>
      </Card.Body>
    </Card.Root>
  );
};

const ImageOnlyCard = ({ block }: { block: ImageOnlyCardBlock }) => {
  return (
    <Card.Root
      overflow="hidden"
      variant="hero"
      colorPalette={block.colorPalette}
      width="full"
    >
      <Image
        src={(block.mainImage as Media).url ?? undefined}
        alt={(block.mainImage as Media).alt ?? block.heading ?? undefined}
        aspectRatio="2/1"
      />
      {block.heading && (
        <Card.Body p={6}>
          <Heading size="3xl" textTransform="uppercase">
            {block.heading}
          </Heading>
        </Card.Body>
      )}
    </Card.Root>
  );
};

const FeaturedCompetitions = ({
  block,
}: {
  block: FeaturedCompetitionsBlock;
}) => {
  return (
    <Card.Root variant="info" colorPalette="grey" width="full">
      <Card.Body justifyContent="space-around">
        <Card.Title display="flex" justifyContent="space-between">
          Featured Upcoming Competitions
          <Button variant="outline">View all Competitions</Button>
        </Card.Title>
        <SimpleGrid columns={2} gap={4}>
          <Card.Root variant="info" colorPalette={block.colorPalette1}>
            <Card.Body>
              <Heading size="3xl">{block.Competition1ID}</Heading>
              <VStack alignItems="start">
                <Badge variant="information" colorPalette={block.colorPalette1}>
                  <Flag code={"US"} fallback={"US"} />
                  <CountryMap code="US" bold /> Seattle
                </Badge>
                <Badge variant="information" colorPalette={block.colorPalette1}>
                  <CompRegoCloseDateIcon />
                  <Text>Jul 3 - 6, 2025</Text>
                </Badge>
                <Badge variant="information" colorPalette={block.colorPalette1}>
                  <CompetitorsIcon />
                  2000 Competitor Limit
                </Badge>
                <Badge variant="information" colorPalette={block.colorPalette1}>
                  <RegisterIcon />0 Spots Left
                </Badge>
                <Badge variant="information" colorPalette={block.colorPalette1}>
                  <LocationIcon />
                  Seattle Convention Center
                </Badge>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root variant="info" colorPalette="yellow">
            <Card.Body>
              <Heading size="3xl">{block.Competition2ID}</Heading>
              <VStack alignItems="start">
                <Badge variant="information" colorPalette={block.colorPalette2}>
                  <Flag code={"NZ"} fallback={"NZ"} />
                  <CountryMap code="NZ" bold /> Auckland
                </Badge>
                <Badge variant="information" colorPalette={block.colorPalette2}>
                  <CompRegoCloseDateIcon />
                  <Text>Dec 12 - 14, 2025</Text>
                </Badge>
                <Badge variant="information" colorPalette={block.colorPalette2}>
                  <CompetitorsIcon />
                  300 Competitor Limit
                </Badge>
                <Badge variant="information" colorPalette={block.colorPalette2}>
                  <RegisterIcon />
                  300 Spots Left
                </Badge>
                <Badge variant="information" colorPalette={block.colorPalette2}>
                  <LocationIcon />
                  Auckland Netball Centre
                </Badge>
              </VStack>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>
      </Card.Body>
    </Card.Root>
  );
};

const TestimonialsSpinner = ({ block }: { block: TestimonialsBlock }) => {
  const slides = block.blocks;
  return (
    <Tabs.Root
      defaultValue={slides[0].id}
      variant="slider"
      orientation="vertical"
      width="full"
    >
      <Card.Root
        variant="info"
        flexDirection="row"
        overflow="hidden"
        colorPalette={slides[0].colorPalette}
        position="relative"
        width="full"
      >
        {/* Dot Navigation */}
        <Tabs.List asChild>
          <Box
            position="absolute"
            right="6"
            top="50%"
            transform="translateY(-50%)"
            display="flex"
            flexDirection="column"
            gap="2"
            zIndex="10"
          >
            {slides.map((slide) => (
              <Tabs.Trigger key={slide.id} value={slide.id!} />
            ))}
          </Box>
        </Tabs.List>

        {/* Slides */}
        {slides.map((slide) => {
          const testimonial = slide.testimonial as Testimonial;

          return (
            <Tabs.Content key={slide.id} value={slide.id!} asChild>
              <Card.Root
                variant="info"
                flexDirection="row"
                overflow="hidden"
                colorPalette={slide.colorPalette}
              >
                <Image
                  src={
                    testimonial.image != null
                      ? ((testimonial.image as Media).url ?? undefined)
                      : "/placeholder.png"
                  }
                  alt={
                    testimonial.image != null
                      ? (testimonial.image as Media).alt
                      : testimonial.punchline
                  }
                  maxW="1/3"
                  objectFit="cover"
                />
                <Card.Body pr="3em">
                  <Card.Title>{testimonial.punchline}</Card.Title>
                  <Separator size="md" />
                  <Card.Description>
                    {testimonial.fullTestimonialMarkdown}
                  </Card.Description>
                  <Text>{testimonial.whoDunnit}</Text>
                </Card.Body>
              </Card.Root>
            </Tabs.Content>
          );
        })}
      </Card.Root>
    </Tabs.Root>
  );
};

type TwoBlocksUnion =
  | TwoBlocksBlock
  | TwoBlocksBranchBlock
  | TwoBlocksLeafBlock;

const renderBlockGroup = (entry: TwoBlocksUnion, keyPrefix = "") => {
  const isHorizontal = entry.alignment === "horizontal";
  let columnCount = 2;
  let col1 = 1;
  let col2 = 1;

  switch (entry.type) {
    case "1/3 & 2/3":
      columnCount = 3;
      col2 = 2;
      break;
    case "2/3 & 1/3":
      columnCount = 3;
      col1 = 2;
      break;
    case "1/2 & 1/2":
      columnCount = 2;
      break;
    case "1/4 & 3/4":
      columnCount = 4;
      col2 = 3;
      break;
    case "3/4 & 1/4":
      columnCount = 4;
      col1 = 3;
      break;
    default:
      columnCount = 2;
  }

  const columns = [col1, col2];

  return (
    <SimpleGrid
      key={keyPrefix}
      columns={isHorizontal ? columnCount : 1}
      gap={8}
      width="full"
    >
      {entry.blocks.map((subEntry, i) => {
        const key = `${keyPrefix}-${i}`;
        switch (subEntry.blockType) {
          case "TextCard":
            return (
              <GridItem key={key} colSpan={columns[i]} display="flex">
                <TextCard block={subEntry} />
              </GridItem>
            );
          case "AnnouncementsSection":
            return (
              <GridItem key={key} colSpan={columns[i] || 1} display="flex">
                <AnnouncementsSection block={subEntry} />
              </GridItem>
            );
          case "twoBlocksBranch":
            return (
              <GridItem key={key} colSpan={columns[i] || 1} display="flex">
                {renderBlockGroup(subEntry, key)}
              </GridItem>
            );
          case "twoBlocksLeaf":
            return (
              <GridItem key={key} colSpan={columns[i] || 1} display="flex">
                {renderBlockGroup(subEntry, key)}
              </GridItem>
            );
          case "ImageBanner":
            return (
              <GridItem key={key} colSpan={columns[i] || 1} display="flex">
                <ImageBanner block={subEntry} />
              </GridItem>
            );
          case "ImageOnlyCard":
            return (
              <GridItem key={key} colSpan={columns[i] || 1} display="flex">
                <ImageOnlyCard block={subEntry} />
              </GridItem>
            );
          case "FeaturedCompetitions":
            return (
              <GridItem key={key} colSpan={columns[i] || 1} display="flex">
                <FeaturedCompetitions block={subEntry} />
              </GridItem>
            );
          case "TestimonialsSpinner":
            return (
              <GridItem key={key} colSpan={columns[i] || 1} display="flex">
                <TestimonialsSpinner block={subEntry} />
              </GridItem>
            );
          default:
            return null;
        }
      })}
    </SimpleGrid>
  );
};

const renderFullBlock = (entry: FullWidthBlock, keyPrefix = "") => {
  return (
    <Box key={keyPrefix} width="full">
      {entry.blocks.map((subEntry, i) => {
        const key = `${keyPrefix}-${i}`;
        switch (subEntry.blockType) {
          case "TextCard":
            return <TextCard key={key} block={subEntry} />;
          case "AnnouncementsSection":
            return <AnnouncementsSection key={key} block={subEntry} />;
          case "ImageBanner":
            return <ImageBanner key={key} block={subEntry} />;
          case "ImageOnlyCard":
            return <ImageOnlyCard key={key} block={subEntry} />;
          case "FeaturedCompetitions":
            return <FeaturedCompetitions key={key} block={subEntry} />;
          case "TestimonialsSpinner":
            return <TestimonialsSpinner key={key} block={subEntry} />;

          default:
            return null;
        }
      })}
    </Box>
  );
};

export default async function Homepage() {
  const payload = await getPayload({ config });
  const homepage = await payload.findGlobal({ slug: "home" });

  const homepageEntries = homepage?.item || [];

  if (homepageEntries.length === 0) {
    return (
      <Center padding={10}>
        <Text>
          No homepage content yet, go ahead and{" "}
          <ChakraLink asChild>
            <Link href="/payload">add some!</Link>
          </ChakraLink>
        </Text>
      </Center>
    );
  }

  return (
    <SimpleGrid columns={1} gap={8} p={8}>
      {homepageEntries.map((entry, index) => {
        // Handle `twoBlocks` layout
        if (entry.blockType === "twoBlocks") {
          return renderBlockGroup(entry, `entry-${index}`);
        }

        // Handle `fullWidth` layout
        if (entry.blockType === "fullWidth") {
          return renderFullBlock(entry, `entry-${index}`);
        }

        // Handle unknown blockType
        return null;
      })}
    </SimpleGrid>
  );
}
