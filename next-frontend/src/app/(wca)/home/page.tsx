import {
  Card,
  Link,
  Heading,
  Button,
  Box,
  Separator,
  Text,
  SimpleGrid,
  GridItem,
  Image,
  VStack,
  Badge,
  Tabs,
} from "@chakra-ui/react";

import Flag from "react-world-flags";
import CountryMap from "@/components/CountryMap";
import AnnouncementsCard from "@/components/AnnouncementsCard";

import CompRegoCloseDateIcon from "@/components/icons/CompRegoCloseDateIcon";
import CompetitorsIcon from "@/components/icons/CompetitorsIcon";
import RegisterIcon from "@/components/icons/RegisterIcon";
import LocationIcon from "@/components/icons/LocationIcon";

export default async function home() {
  const slides = [
    {
      id: "tab1",
      image: "newcomer.png",
      title: "“I Can’t Wait for the next one!”",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      subtitle: "John Doe",
      colorPalette: "green",
    },
    {
      id: "tab2",
      image: "newcomer.png",
      title: "“Best Event Ever!”",
      description:
        "Aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
      subtitle: "John Doe",
      colorPalette: "blue",
    },
    {
      id: "tab3",
      image: "newcomer.png",
      title: "“Loved every second”",
      description:
        "Officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem.",
      subtitle: "John Doe",
      colorPalette: "orange",
    },
  ];

  return (
    <SimpleGrid columns={1} gap={8} p={8}>
      <Card.Root
        variant="info"
        flexDirection="row"
        overflow="hidden"
        colorPalette="blue"
        size="lg"
      >
        <Box
          position="relative"
          flex="1"
          minW="50%"
          maxW="50%"
          overflow="hidden"
        >
          <Image
            src="merch.png"
            alt="Cubing event"
            objectFit="cover"
            width="100%"
            height="100%"
          />
          {/* Blue Gradient Overlay */}
          <Box
            position="absolute"
            top="0"
            right="0"
            bottom="0"
            left="50%"
            style={{
              backgroundImage:
                "linear-gradient(to right, transparent, var(--chakra-colors-blue-100))",
            }}
            zIndex="1"
          />
        </Box>

        <Card.Body
          flex="1"
          zIndex="2"
          color="white"
          p="8"
          bg="blue.100"
          justifyContent="center"
          pr="15%"
          backgroundImage="url('placeholderIcons.png')" // or bgImage
          backgroundSize="35%"
          backgroundPosition="110% 200%"
          backgroundRepeat="no-repeat"
        >
          <Heading size="4xl" color="yellow.50" mb="4">
            WELCOME TO THE WORLD OF SPEEDCUBING
          </Heading>
          <Text fontSize="md">
            At the World Cube Association, we bring cubers together to twist,
            solve, and compete in the ultimate test of skill and speed.
          </Text>
        </Card.Body>
      </Card.Root>

      <SimpleGrid columns={4} gap={8}>
        <GridItem colSpan={2} display="flex">
          <Card.Root variant="info" colorPalette="green" size="lg">
            <Card.Body>
              <Card.Title>Twist, Solve, Compete</Card.Title>
              <Card.Description>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
                in reprehenderit in voluptate velit esse cillum dolore eu fugiat
                nulla pariatur. Excepteur sint occaecat cupidatat non proident,
                sunt in culpa qui officia deserunt mollit anim id est laborum.
              </Card.Description>
            </Card.Body>
          </Card.Root>
        </GridItem>
        <GridItem colSpan={1} display="flex">
          <Card.Root variant="info" size="lg">
            <Card.Body>
              <Card.Title>Support the WCA</Card.Title>
              <Separator size="md" />
              <Card.Description>
                The World Cube Association is a 501(c)(3) tax-exempt
                organization. <br />
                <br />
                As a 100% volunteer-led nonprofit, we welcome your donations to
                help us further our vision of having more enjoyable competitions
                all over the world.
              </Card.Description>
              <Button mr="auto">Learn more</Button>
            </Card.Body>
          </Card.Root>
        </GridItem>
        <GridItem colSpan={1} display="flex">
          <Card.Root variant="info" size="lg">
            <Card.Body>
              <Card.Title>Get in touch!</Card.Title>
              <Separator size="md" />
              <Card.Description>
                If you wish to contact us, you can do so through our contact
                form or any of our social media platforms. <br />
                <br />
                If you have any questions about the different processes of the
                WCA, make sure to go through our{" "}
                <Link hoverArrow>Frequently Asked Questions!</Link>
              </Card.Description>
              <Button mr="auto">Take me to the WCA contact form</Button>
            </Card.Body>
          </Card.Root>
        </GridItem>
      </SimpleGrid>

      <Card.Root
        variant="info"
        flexDirection="row"
        overflow="hidden"
        colorPalette="yellow"
        size="lg"
      >
        <Image
          src="newMerch.png"
          alt="new Merchandise"
          objectFit="cover"
          maxW="50%"
          height="25rem"
          bg="yellow.50"
        />
        <Card.Body
          flex="1"
          zIndex="2"
          color="yellow.100"
          p="8"
          bg="yellow.50"
          justifyContent="center"
          alignItems="flex-end"
          textAlign="right"
          backgroundImage="url('yellowBrandImage.svg')"
          backgroundSize="100%"
          backgroundPosition="right"
          backgroundRepeat="no-repeat"
        >
          <Heading size="4xl" color="yellow.100" mb="4">
            WEVE GOT NEW MERCH!
          </Heading>
          <Text fontSize="md">
            Check out our newly launched official merchandise which includes a
            selection of apparels ranging from tshirts to hoodies.
          </Text>
          <Button ml="auto">Shop WCA</Button>
        </Card.Body>
      </Card.Root>

      <SimpleGrid columns={2} gap={8}>
        <SimpleGrid columns={2} gap={8}>
          <Card.Root overflow="hidden" variant="hero" colorPalette="green">
            <Image src="about.png" alt="About the WCA" aspectRatio={2 / 1} />
            <Card.Body p={6}>
              <Heading size="3xl" textTransform="uppercase">
                About Us
              </Heading>
            </Card.Body>
          </Card.Root>
          <Card.Root overflow="hidden" variant="hero" colorPalette="red">
            <Image
              src="competitions.png"
              alt="WCA Competitions"
              aspectRatio={2 / 1}
            />
            <Card.Body p={6}>
              <Heading size="3xl" textTransform="uppercase">
                Competitions
              </Heading>
            </Card.Body>
          </Card.Root>
          <Card.Root overflow="hidden" variant="hero" colorPalette="blue">
            <Image src="merch.png" alt="WCA Merchandise" aspectRatio={2 / 1} />
            <Card.Body p={6}>
              <Heading size="3xl" textTransform="uppercase">
                Merchandise
              </Heading>
            </Card.Body>
          </Card.Root>
          <Card.Root overflow="hidden" variant="hero" colorPalette="orange">
            <Image src="records.png" alt="WCA Records" aspectRatio={2 / 1} />
            <Card.Body p={6}>
              <Heading size="3xl" textTransform="uppercase">
                Records
              </Heading>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>
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
      </SimpleGrid>

      <SimpleGrid columns={3} gap={8}>
        <GridItem colSpan={2} display="flex">
          {/* TODO - make this changel slide every so often automatically */}
          <Tabs.Root
            defaultValue="tab1"
            variant="slider"
            orientation="vertical"
          >
            <Card.Root
              variant="info"
              flexDirection="row"
              overflow="hidden"
              colorPalette={slides.find((s) => s.id === "tab1")?.colorPalette} // Default
              position="relative"
              width="full"
            >
              {/* Tab Triggers (Dots) */}
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
                    <Tabs.Trigger
                      value={slide.id}
                      key={slide.id}
                    ></Tabs.Trigger>
                  ))}
                </Box>
              </Tabs.List>

              {/* Tab Content */}
              {slides.map((slide) => (
                <Tabs.Content value={slide.id} key={slide.id} asChild>
                  <Card.Root
                    variant="info"
                    flexDirection="row"
                    overflow="hidden"
                    colorPalette={slide.colorPalette}
                  >
                    <Image
                      src={slide.image}
                      alt={slide.title}
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
        </GridItem>
        <GridItem colSpan={1} display="flex">
          <Card.Root variant="info">
            <Card.Body>
              <Card.Title>See what competitors have to say</Card.Title>
              <Separator size="md" />
              <Card.Description>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat. <br />
                <br />
                Duis aute irure dolor in reprehenderit in voluptate velit esse
                cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
                cupidatat non proident, sunt in culpa qui officia deserunt
                mollit anim id est laborum.
              </Card.Description>
              <Button mr="auto">Test Button</Button>
            </Card.Body>
          </Card.Root>
        </GridItem>
      </SimpleGrid>

      <SimpleGrid columns={3} gap={8}>
        <GridItem colSpan={1} display="flex">
          <Card.Root variant="info">
            <Image
              src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80"
              alt="Green double couch with wooden legs"
              aspectRatio="3/1"
            />
            <Card.Body>
              <Card.Title>Test Heading</Card.Title>
              <Separator size="md" />
              <Card.Description>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat.
              </Card.Description>
              <Button>Learn More</Button>
            </Card.Body>
          </Card.Root>
        </GridItem>
        <GridItem colSpan={2} display="flex">
          <Card.Root variant="info" colorPalette="grey" width="full">
            <Card.Body justifyContent="space-around">
              <Card.Title display="flex" justifyContent="space-between">
                Featured Upcoming Competitions
                <Button variant="outline">View all Competitions</Button>
              </Card.Title>
              <SimpleGrid columns={2} gap={4}>
                <Card.Root variant="info" colorPalette="red">
                  <Card.Body>
                    <Heading size="3xl">World Championships 2025</Heading>
                    <VStack alignItems="start">
                      <Badge variant="information" colorPalette="red">
                        <Flag code={"US"} fallback={"US"} />
                        <CountryMap code="US" bold /> Seattle
                      </Badge>
                      <Badge variant="information" colorPalette="red">
                        <CompRegoCloseDateIcon />
                        <Text>Jul 3 - 6, 2025</Text>
                      </Badge>
                      <Badge variant="information" colorPalette="red">
                        <CompetitorsIcon />
                        2000 Competitor Limit
                      </Badge>
                      <Badge variant="information" colorPalette="red">
                        <RegisterIcon />0 Spots Left
                      </Badge>
                      <Badge variant="information" colorPalette="red">
                        <LocationIcon />
                        Seattle Convention Center
                      </Badge>
                    </VStack>
                  </Card.Body>
                </Card.Root>

                <Card.Root variant="info" colorPalette="yellow">
                  <Card.Body>
                    <Heading size="3xl">New Zealand Nationals 2025</Heading>
                    <VStack alignItems="start">
                      <Badge variant="information" colorPalette="yellow">
                        <Flag code={"NZ"} fallback={"NZ"} />
                        <CountryMap code="NZ" bold /> Auckland
                      </Badge>
                      <Badge variant="information" colorPalette="yellow">
                        <CompRegoCloseDateIcon />
                        <Text>Dec 12 - 14, 2025</Text>
                      </Badge>
                      <Badge variant="information" colorPalette="yellow">
                        <CompetitorsIcon />
                        300 Competitor Limit
                      </Badge>
                      <Badge variant="information" colorPalette="yellow">
                        <RegisterIcon />
                        300 Spots Left
                      </Badge>
                      <Badge variant="information" colorPalette="yellow">
                        <LocationIcon />
                        Auckland Netball Centre
                      </Badge>
                    </VStack>
                  </Card.Body>
                </Card.Root>
              </SimpleGrid>
            </Card.Body>
          </Card.Root>
        </GridItem>
      </SimpleGrid>
    </SimpleGrid>
  );
}
