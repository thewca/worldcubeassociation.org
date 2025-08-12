"use server";

import React from "react";
import {
  SimpleGrid,
  GridItem,
  Button,
  Card,
  Separator,
  Box,
  Image as ChakraImage,
  Heading,
  Text,
  Tabs,
  Badge,
  VStack,
  Link as ChakraLink,
  Center,
} from "@chakra-ui/react";
import { MarkdownProse } from "@/components/Markdown";
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
  Testimonial,
  AnnouncementsSectionBlock,
  Announcement,
  User,
} from "@/types/payload";
import Link from "next/link";
import { route } from "nextjs-routes";

const TextCard = ({ block }: { block: TextCardBlock }) => {
  return (
    <Card.Root
      variant={block.variant}
      size="lg"
      colorPalette={block.colorPalette}
      width="full"
    >
      {block.headerImage && (
        <ChakraImage
          src={(block.headerImage as Media).url ?? undefined}
          alt={(block.headerImage as Media).alt ?? undefined}
          aspectRatio="3/1"
        />
      )}
      <Card.Body>
        <Card.Title>{block.heading}</Card.Title>
        {block.separatorAfterHeading && <Separator size="md" />}
        <Card.Description>
          <MarkdownProse
            content={block.bodyMarkdown!}
            color="colorPalette.fg"
          />
        </Card.Description>
        {block.buttonText?.trim() && (
          <Button mr="auto" asChild>
            <ChakraLink href={block.buttonLink!}>{block.buttonText}</ChakraLink>
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
  const colorPaletteTone = block.colorPaletteDarker ? 100 : 50;
  const headingColorPalette = block.headingColor ?? "colorPalette";

  return (
    <Card.Root
      variant="info"
      flexDirection="row"
      overflow="hidden"
      colorPalette={block.colorPalette}
      size="lg"
    >
      <Box position="relative" width="50%" overflow="hidden">
        <ChakraImage
          src={(block.mainImage as Media).url ?? undefined}
          alt={(block.mainImage as Media).alt ?? undefined}
          objectFit="cover"
          width="100%"
          height="40vh"
          bg={`colorPalette.${colorPaletteTone}`}
        />
        {/* Gradient Overlay */}
        <Box
          position="absolute"
          top="0"
          right="0"
          bottom="0"
          left="50%"
          bgImage={`linear-gradient(to right, transparent, {colors.colorPalette.${colorPaletteTone}})`}
          zIndex="1"
        />
      </Box>

      <Card.Body
        flex="1"
        zIndex="2"
        color="white"
        p="8"
        bg={`colorPalette.${colorPaletteTone}`}
        justifyContent="center"
        paddingRight="15%"
        backgroundImage={
          block.bgImage != null
            ? `url('${(block.bgImage as Media).url}')`
            : undefined
        }
        backgroundSize={`${block.bgSize}%`}
        backgroundPosition={block.bgPos}
        backgroundRepeat="no-repeat"
      >
        <Heading
          size="4xl"
          color={`${headingColorPalette}.emphasized`}
          marginBottom="4"
          textTransform="uppercase"
        >
          {block.heading}
        </Heading>
        <MarkdownProse
          content={block.bodyMarkdown!}
          color="colorPalette.fg"
          fontSize="md"
        />
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
      <ChakraImage
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
        <SimpleGrid columns={block.competitions?.length} gap={4}>
          {block.competitions?.map((featuredComp) => (
            <Card.Root
              key={featuredComp.competitionId}
              variant="info"
              colorPalette={featuredComp.colorPalette}
            >
              <Card.Body>
                <Heading size="3xl">{featuredComp.competitionId}</Heading>
                <VStack alignItems="start">
                  <Badge
                    variant="information"
                    colorPalette={featuredComp.colorPalette}
                  >
                    <Flag code="US" fallback="US" />
                    <CountryMap code="US" bold /> Seattle
                  </Badge>
                  <Badge
                    variant="information"
                    colorPalette={featuredComp.colorPalette}
                  >
                    <CompRegoCloseDateIcon />
                    <Text>Jul 3 - 6, 2025</Text>
                  </Badge>
                  <Badge
                    variant="information"
                    colorPalette={featuredComp.colorPalette}
                  >
                    <CompetitorsIcon />
                    2000 Competitor Limit
                  </Badge>
                  <Badge
                    variant="information"
                    colorPalette={featuredComp.colorPalette}
                  >
                    <RegisterIcon />0 Spots Left
                  </Badge>
                  <Badge
                    variant="information"
                    colorPalette={featuredComp.colorPalette}
                  >
                    <LocationIcon />
                    Seattle Convention Center
                  </Badge>
                </VStack>
              </Card.Body>
            </Card.Root>
          ))}
        </SimpleGrid>
      </Card.Body>
    </Card.Root>
  );
};

const TestimonialsSpinner = ({ block }: { block: TestimonialsBlock }) => {
  const slides = block.slides;

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
                <ChakraImage
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
                    <MarkdownProse
                      content={testimonial.fullTestimonialMarkdown!}
                      color="colorPalette.fg"
                    />
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
          case "FeaturedComps":
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
          case "FeaturedComps":
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
            <Link
              href={route({ pathname: "/payload/[[...segments]]", query: {} })}
            >
              add some!
            </Link>
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
