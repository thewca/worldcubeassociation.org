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
  Link,
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
  BasicCardBlock,
  CardWithImageBlock,
  FeaturedCompetitionsBlock,
  FullWidthBlock,
  HeroCardBlock,
  ImageBannerBlock,
  ImageCardBlock,
  Media,
  TestimonialsBlock,
  TwoBlocksBlock,
  TwoBlocksBranchBlock,
  TwoBlocksLeafBlock,
} from "@/payload-types";

const colorMap: Record<string, string> = {
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

const colorGradientMap: Record<string, string> = {
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
};

const BasicCard = ({ block }: { block: BasicCardBlock }) => {
  return (
    <Card.Root variant="info" size="lg" width="full">
      <Card.Body>
        <Card.Title>{block.heading}</Card.Title>
        <Separator size="md" />
        <Card.Description>{block.body}</Card.Description>
        {block.buttonText?.trim() && (
          <Button mr="auto" asChild>
            <Link href={block.buttonLink!}>{block.buttonText}</Link>
          </Button>
        )}
      </Card.Body>
    </Card.Root>
  );
};

const HeroCard = ({ block }: { block: HeroCardBlock }) => {
  return (
    <Card.Root
      variant="info"
      size="lg"
      colorPalette={block.colorPalette}
      width="full"
    >
      <Card.Body>
        <Card.Title>{block.heading}</Card.Title>
        <Card.Description>{block.body}</Card.Description>
        {block.buttonText?.trim() && (
          <Button mr="auto" asChild>
            <Link href={block.buttonLink!}>{block.buttonText}</Link>
          </Button>
        )}
      </Card.Body>
    </Card.Root>
  );
};

const CardWithImage = ({ block }: { block: CardWithImageBlock }) => {
  return (
    <Card.Root variant="info" width="full">
      <Image
        src={(block.image as Media).url ?? undefined}
        alt="Green double couch with wooden legs"
        aspectRatio="3/1"
      />
      <Card.Body>
        <Card.Title>{block.heading}</Card.Title>
        <Separator size="md" />
        <Card.Description>{block.body}</Card.Description>
        {block.buttonText?.trim() && (
          <Button mr="auto" asChild>
            <Link href={block.buttonLink!}>{block.buttonText}</Link>
          </Button>
        )}
      </Card.Body>
    </Card.Root>
  );
};

const AnnouncementsSection = () => {
  return (
    <AnnouncementsCard
      hero={{
        title: "Big Update: WCA World Championship 2025!",
        postedBy: "Mitchell Anderson",
        postedAt: "May 25, 2025",
        markdown: `**Get ready!**\n\nThe next WCA World Championship is coming to Sydney 🇦🇺. More details soon.`,
        fullLink: "/articles/world-champs-2025",
      }}
      others={[
        {
          title: "New Regulations Update",
          href: "/articles/regulations-update",
        },
        {
          title: "Highlights from Asian Championship",
          href: "/articles/asia-highlights",
        },
      ]}
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
          alt="Cubing event"
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
        <Heading size="4xl" color={colorMap[block.headingColor]} mb="4">
          {block.heading}
        </Heading>
        <Text fontSize="md" color={colorMap[block.textColor]}>
          {block.body}
        </Text>
      </Card.Body>
    </Card.Root>
  );
};

const ImageCard = ({ block }: { block: ImageCardBlock }) => {
  return (
    <Card.Root
      overflow="hidden"
      variant="hero"
      colorPalette={block.colorPalette}
      width="full"
    >
      <Image
        src={(block.mainImage as Media).url ?? undefined}
        alt={block.heading}
        aspectRatio={2 / 1}
      />
      <Card.Body p={6}>
        <Heading size="3xl" textTransform="uppercase">
          {block.heading}
        </Heading>
      </Card.Body>
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

const Testimonials = ({ block }: { block: TestimonialsBlock }) => {
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
        {slides.map((slide) => (
          <Tabs.Content key={slide.id} value={slide.id!} asChild>
            <Card.Root
              variant="info"
              flexDirection="row"
              overflow="hidden"
              colorPalette={slide.colorPalette}
            >
              <Image
                src={
                  slide.image != null
                    ? ((slide.image as Media).url ?? undefined)
                    : "/placeholder.png"
                }
                alt={
                  slide.image != null ? (slide.image as Media).alt : slide.title
                }
                maxW="1/3"
                objectFit="cover"
              />
              <Card.Body pr="3em">
                <Card.Title>{slide.title}</Card.Title>
                <Separator size="md" />
                <Card.Description>{slide.description}</Card.Description>
                <Text>{slide.subtitle}</Text>
              </Card.Body>
            </Card.Root>
          </Tabs.Content>
        ))}
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
          case "BasicCard":
            return (
              <GridItem key={key} colSpan={columns[i]} display="flex">
                <BasicCard block={subEntry} />
              </GridItem>
            );
          case "HeroCard":
            return (
              <GridItem key={key} colSpan={columns[i]} display="flex">
                <HeroCard block={subEntry} />
              </GridItem>
            );
          case "CardWithImage":
            return (
              <GridItem key={key} colSpan={columns[i]} display="flex">
                <CardWithImage block={subEntry} />
              </GridItem>
            );

          case "AnnouncementsSection":
            return (
              <GridItem key={key} colSpan={columns[i] || 1} display="flex">
                <AnnouncementsSection />
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
          case "ImageCard":
            return (
              <GridItem key={key} colSpan={columns[i] || 1} display="flex">
                <ImageCard block={subEntry} />
              </GridItem>
            );
          case "FeaturedCompetitions":
            return (
              <GridItem key={key} colSpan={columns[i] || 1} display="flex">
                <FeaturedCompetitions block={subEntry} />
              </GridItem>
            );
          case "testimonials":
            return (
              <GridItem key={key} colSpan={columns[i] || 1} display="flex">
                <Testimonials block={subEntry} />
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
          case "BasicCard":
            return <BasicCard key={key} block={subEntry} />;
          case "HeroCard":
            return <HeroCard key={key} block={subEntry} />;
          case "AnnouncementsSection":
            return <AnnouncementsSection />;
          case "ImageBanner":
            return <ImageBanner key={key} block={subEntry} />;
          case "ImageCard":
            return <ImageCard key={key} block={subEntry} />;
          case "FeaturedCompetitions":
            return <FeaturedCompetitions key={key} block={subEntry} />;
          case "testimonials":
            return <Testimonials key={key} block={subEntry} />;

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
