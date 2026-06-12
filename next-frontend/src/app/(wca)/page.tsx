import type { Metadata } from "next";
import React, { ComponentProps } from "react";

export const metadata: Metadata = {
  title: { absolute: "World Cube Association" },
};
import {
  SimpleGrid,
  GridItem,
  Button,
  Card,
  Separator,
  Box,
  Text,
  VStack,
  Link as ChakraLink,
  Center,
  HStack,
  AbsoluteCenter,
  Float,
  Carousel,
} from "@chakra-ui/react";
import { ChakraMarkdown } from "@/components/Markdown";
import AnnouncementsCard from "@/components/AnnouncementsCard";
import { getPayload } from "payload";
import config from "@payload-config";

import type {
  TextCardBlock,
  FeaturedCompetitionsBlock,
  ImageBannerBlock,
  ImageOnlyCardBlock,
  Media,
  TestimonialsBlock,
  TwoBlocksLevel0Block,
  TwoBlocksLevel1Block,
  TwoBlocksLevel2Block,
  Testimonial,
  AnnouncementsSectionBlock,
  Announcement,
  ColorPaletteSelect,
  Home,
  GrowthStrategy,
} from "@/types/payload";
import Link from "next/link";
import { route } from "nextjs-routes";
import { getT } from "@/lib/i18n/get18n";
import { draftMode } from "next/headers";
import { MediaImage } from "@/components/MediaImage";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import CompetitionShortlist from "@/components/competitions/CompetitionShortlist";
import OpenapiError from "@/components/ui/openapiError";

type TwoBlocksUnion =
  | TwoBlocksLevel0Block
  | TwoBlocksLevel1Block
  | TwoBlocksLevel2Block;

type TwoBlocksRatio = TwoBlocksUnion["ratio"];
type TwoBlocksSpanConfig = { left: number; right: number };

const RATIO_GRID_MAP: Record<TwoBlocksRatio, TwoBlocksSpanConfig> = {
  "1/3 & 2/3": { left: 1, right: 2 },
  "2/3 & 1/3": { left: 2, right: 1 },
  "1/2 & 1/2": { left: 1, right: 1 },
  "1/4 & 3/4": { left: 1, right: 3 },
  "3/4 & 1/4": { left: 3, right: 1 },
};

const TextCard = ({ block }: { block: TextCardBlock }) => {
  return (
    <Card.Root
      colorPalette={block.colorPalette}
      colorVariant="slatePastel"
      width="full"
    >
      {block.headerImage && (
        <MediaImage media={block.headerImage as Media} aspectRatio="3/1" />
      )}
      <Card.Body>
        <Card.Title textStyle={{ base: "h3", md: "h2" }}>
          {block.heading}
        </Card.Title>
        {block.separatorAfterHeading && <Separator size="md" />}
        <ChakraMarkdown paragraphAs={Card.Description} textStyle="body">
          {block.bodyMarkdown}
        </ChakraMarkdown>
      </Card.Body>
      {block.buttons && block.buttons.length > 0 && (
        <Card.Footer asChild>
          <HStack>
            {block.buttons.map((button) => (
              <Button
                key={button.id}
                asChild
                colorPalette={button.inheritColorScheme ? undefined : "blue"}
                variant={button.inheritColorScheme ? "outline" : "solid"}
                bg={button.inheritColorScheme ? undefined : "colorPalette.1A"}
                _hover={{
                  bg: button.inheritColorScheme
                    ? "colorPalette.emphasized"
                    : undefined,
                }}
              >
                <ChakraLink
                  color="colorPalette.pastelContrast"
                  textStyle={undefined}
                  href={button.hyperlink}
                >
                  {button.displayText}
                </ChakraLink>
              </Button>
            ))}
          </HStack>
        </Card.Footer>
      )}
    </Card.Root>
  );
};

const AnnouncementsSection = ({
  block,
}: {
  block: AnnouncementsSectionBlock;
}) => {
  const mainAnnouncement = block.mainAnnouncement as Announcement;
  const furtherAnnouncements =
    block.furtherAnnouncements?.map(
      (announcement) => announcement as Announcement,
    ) || [];

  return (
    <AnnouncementsCard
      hero={mainAnnouncement}
      others={furtherAnnouncements}
      colorPalette={block.colorPalette}
      showSeeAll={block.showSeeAll}
    />
  );
};

const BannerImageWithGradient = ({
  mainImage,
  targetColor,
  gradientDirection,
  boxWidth = "50%",
}: {
  mainImage: Media;
  targetColor: ComponentProps<typeof Box>["bg"];
  gradientDirection: "left" | "right";
  boxWidth?: ComponentProps<typeof Box>["width"];
}) => {
  return (
    <Box position="relative" width={boxWidth} hideBelow="md">
      <MediaImage
        media={mainImage as Media}
        width="full"
        maxHeight="sm"
        bg={targetColor}
      />
      <AbsoluteCenter
        width="101%" // weirdly enough, 100% (or "full") creates a tiny gap even though it shouldn't. Shout if you know how to fix this!
        height="full"
        bg={`linear-gradient(to ${gradientDirection}, transparent, transparent, {colors.${targetColor}})`}
      />
    </Box>
  );
};

const ImageBanner = ({ block }: { block: ImageBannerBlock }) => {
  return (
    <Card.Root
      flexDirection="row"
      colorPalette={block.colorPalette}
      colorVariant="slatePastel"
      width="full"
      maxHeight="xs" // somewhat arbitrary, if you have a better idea please shout
      overflow="hidden"
    >
      {block.imagePosition === "left" && (
        <BannerImageWithGradient
          mainImage={block.mainImage as Media}
          targetColor="colorPalette.1A"
          gradientDirection="right"
          boxWidth={block.heading ? "50%" : "100%"}
        />
      )}
      {block.heading && (
        <Card.Body justifyContent="center">
          <Card.Title
            colorPalette={block.headingColor}
            textStyle={{ base: "h3", md: "h2", xl: "h1" }}
          >
            {block.heading}
          </Card.Title>
          <ChakraMarkdown
            paragraphAs={Card.Description}
            textStyle={{ base: "body", md: "s2" }}
          >
            {block.bodyMarkdown}
          </ChakraMarkdown>
          {block.bgImage && (
            <Float
              placement="bottom-end"
              width={`${block.bgSize}%`}
              height={`${block.bgSize}%`}
              offset={28}
            >
              <MediaImage
                media={block.bgImage as Media}
                width="auto"
                height="full"
                fit="contain"
              />
            </Float>
          )}
        </Card.Body>
      )}
      {block.imagePosition === "right" && (
        <BannerImageWithGradient
          mainImage={block.mainImage as Media}
          targetColor="colorPalette.1A"
          gradientDirection="left"
          boxWidth={block.heading ? "50%" : "100%"}
        />
      )}
    </Card.Root>
  );
};

const ImageOnlyCardImage = ({ block }: { block: ImageOnlyCardBlock }) => {
  return (
    <MediaImage
      media={block.mainImage as Media}
      altFallback={block.heading}
      aspectRatio="2/1"
      maxHeight="10rem" // somewhat arbitrary, if you have a better idea please shout!
    />
  );
};

const ImageOnlyCard = ({ block }: { block: ImageOnlyCardBlock }) => {
  return (
    <Card.Root
      overflow="hidden"
      colorPalette={block.colorPalette}
      colorVariant="slatePastel"
      width="full"
    >
      {block.textPosition === "bottom" && <ImageOnlyCardImage block={block} />}
      {block.heading && (
        <Card.Body>
          <Card.Title textStyle="h2">{block.heading}</Card.Title>
        </Card.Body>
      )}
      {block.textPosition === "top" && <ImageOnlyCardImage block={block} />}
    </Card.Root>
  );
};

const FeaturedCompetition = async ({
  competitionId,
  colorPalette,
}: {
  competitionId: string;
  colorPalette: ColorPaletteSelect;
}) => {
  const { t } = await getT();
  const {
    data: competition,
    error,
    response,
  } = await getCompetitionInfo(competitionId);

  if (error) return <OpenapiError t={t} response={response} />;

  return (
    <Card.Root
      colorPalette={colorPalette}
      colorVariant="slatePastel"
      height="full"
    >
      <Card.Body>
        <Card.Title textStyle={{ base: "h3", md: "h2" }} flex="1">
          {competition.name}
        </Card.Title>
        <CompetitionShortlist comp={competition} t={t} />
      </Card.Body>
    </Card.Root>
  );
};

const FeaturedCompetitions = async ({
  block,
}: {
  block: FeaturedCompetitionsBlock;
}) => (
  <Card.Root width="full">
    <Card.Body>
      <Card.Title asChild>
        <HStack justify="space-between" wrap="wrap">
          <Text textStyle={{ base: "h2", md: "h1" }}>
            Upcoming Competitions
          </Text>
          <Button asChild variant="outline">
            <Link href="/competitions">View all Competitions</Link>
          </Button>
        </HStack>
      </Card.Title>
      <SimpleGrid columns={{ base: 1, md: block.competitions?.length }} gap={4}>
        {block.competitions?.map((featuredComp) => (
          <FeaturedCompetition
            key={featuredComp.id}
            competitionId={featuredComp.competitionId}
            colorPalette={featuredComp.colorPalette}
          />
        ))}
      </SimpleGrid>
    </Card.Body>
  </Card.Root>
);

const TestimonialsSpinner = ({ block }: { block: TestimonialsBlock }) => {
  const slides = block.slides;

  return (
    <Carousel.Root
      orientation="vertical"
      slideCount={slides.length}
      width="full"
      maxHeight="lg"
      loop
      position="relative"
    >
      <Carousel.ItemGroup width="full">
        {slides.map((slide, i) => {
          const testimonial = slide.testimonial as Testimonial;

          return (
            <Carousel.Item key={slide.id} index={i} asChild>
              <Card.Root
                colorVariant="slatePastel"
                flexDirection={{ base: "column", md: "row" }}
                overflow="hidden"
                colorPalette={slide.colorPalette}
              >
                <MediaImage
                  media={testimonial.image as Media}
                  altFallback={testimonial.punchline}
                  maxW={{ base: "full", md: "1/3" }}
                />
                <Card.Body>
                  <Card.Title textStyle={{ base: "h3", md: "h1" }}>
                    {testimonial.punchline}
                  </Card.Title>
                  <Separator size="md" />
                  <ChakraMarkdown
                    paragraphAs={Card.Description}
                    textStyle="quote"
                  >
                    {testimonial.fullTestimonialMarkdown!}
                  </ChakraMarkdown>
                  <Text>{testimonial.whoDunnit}</Text>
                </Card.Body>
              </Card.Root>
            </Carousel.Item>
          );
        })}
        <Float placement="middle-end" offset={8}>
          <Carousel.Control>
            <Carousel.Indicators />
          </Carousel.Control>
        </Float>
      </Carousel.ItemGroup>
    </Carousel.Root>
  );
};

type VerticalLayout =
  | Home["layout"]
  | TwoBlocksUnion["left"]
  | TwoBlocksUnion["right"];

const renderVerticalLayout = (
  verticalLayout: VerticalLayout,
  level: number = 0,
  growthStrategy?: GrowthStrategy,
) => {
  return (
    <VStack
      gap={8}
      justifyContent={
        growthStrategy === "justify" ? "space-between" : undefined
      }
    >
      {verticalLayout.map((entry) => {
        return (
          <Box
            key={entry.id}
            asChild
            flexGrow={growthStrategy === "grow" ? "1" : undefined}
            // In case of justifying the space, a stack with one single child (CSS :only-child)
            //   cannot push it towards the beginning and end simultaneously. So in that case,
            //   also grow if the selected strategy is `justify`, to simulate the visual impression
            //   of "filling" the container like it would be if there was more than one item.
            _only={{ flexGrow: growthStrategy === "justify" ? "1" : undefined }}
          >
            {renderBlock(entry, level, growthStrategy)}
          </Box>
        );
      })}
    </VStack>
  );
};

const renderHorizontalSplit = (
  entry: TwoBlocksUnion,
  level: number,
  growthStrategy?: GrowthStrategy,
) => {
  const { left: leftCols, right: rightCols } = RATIO_GRID_MAP[entry.ratio];

  const totalCols = leftCols + rightCols;
  const foldMd = level <= 1;

  // If a parent horizontal splitter has a `grow` strategy,
  //   it will look weird if children in either half of the splitter don't grow.
  // So make sure that any `grow` splitter passes down "at least" `justify` as a base strategy.
  const fallbackGrowthStrategy =
    growthStrategy === "grow" ? "justify" : undefined;

  return (
    <SimpleGrid
      columns={{ base: 1, md: foldMd ? 1 : totalCols, lg: totalCols }}
      gap={8}
      width="full"
    >
      <GridItem
        colSpan={{ base: 1, md: foldMd ? 1 : leftCols, lg: leftCols }}
        asChild
      >
        {renderVerticalLayout(
          entry.left,
          level,
          entry.growthStrategy || fallbackGrowthStrategy,
        )}
      </GridItem>
      <GridItem
        colSpan={{ base: 1, md: foldMd ? 1 : rightCols, lg: rightCols }}
        asChild
      >
        {renderVerticalLayout(
          entry.right,
          level,
          entry.growthStrategy || fallbackGrowthStrategy,
        )}
      </GridItem>
    </SimpleGrid>
  );
};

type LayoutBlock = VerticalLayout[number];

const renderBlock = (
  entry: LayoutBlock,
  level: number,
  growthStrategy?: GrowthStrategy,
) => {
  switch (entry.blockType) {
    case "twoBlocksLevel0":
    case "twoBlocksLevel1":
    case "twoBlocksLevel2":
      return renderHorizontalSplit(entry, level + 1, growthStrategy);
    case "TextCard":
      return <TextCard block={entry} />;
    case "AnnouncementsSection":
      return <AnnouncementsSection block={entry} />;
    case "ImageBanner":
      return <ImageBanner block={entry} />;
    case "ImageOnlyCard":
      return <ImageOnlyCard block={entry} />;
    case "FeaturedComps":
      return <FeaturedCompetitions block={entry} />;
    case "TestimonialsSpinner":
      return <TestimonialsSpinner block={entry} />;

    default:
      return null;
  }
};

export default async function Homepage() {
  const payload = await getPayload({ config });
  const { isEnabled: isDraftMode } = await draftMode();
  const homepage = await payload.findGlobal({
    slug: "home",
    draft: isDraftMode,
  });

  const homepageEntries = homepage.layout;

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
    <Box p={{ base: "3.5", md: "6", lg: "8" }} asChild>
      {renderVerticalLayout(homepageEntries)}
    </Box>
  );
}
