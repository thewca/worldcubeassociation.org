"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { usePermissions } from "@/providers/PermissionProvider";
import { Button, Code, Container, Text, Link as ChakraLink, HStack, Card, SimpleGrid, Box } from "@chakra-ui/react";
import Link from "next/link";

import AboutTheRegulationsIcon from "@/components/icons/AboutTheRegulationsIcon";
import AboutTheWcaIcon from "@/components/icons/AboutTheWcaIcon";
import AdminResultsIcon from "@/components/icons/AdminResultsIcon";
import AllCompsIcon from "@/components/icons/AllCompsIcon";
import BookmarkIcon from "@/components/icons/BookmarkIcon";
import CloneIcon from "@/components/icons/CloneIcon";
import CompNotStartedIcon from "@/components/icons/CompNotStartedIcon";
import CompRegoClosedIcon from "@/components/icons/CompRegoClosedIcon";
import CompRegoClosedRedIcon from "@/components/icons/CompRegoClosed_redIcon";
import CompRegoFullButOpenIcon from "@/components/icons/CompRegoFullButOpenIcon";
import CompRegoFullButOpenOrangeIcon from "@/components/icons/CompRegoFullButOpen_orangeIcon";
import CompRegoNotFullOpenIcon from "@/components/icons/CompRegoNotFullOpenIcon";
import CompRegoNotFullOpenGreenIcon from "@/components/icons/CompRegoNotFullOpen_greenIcon";
import CompRegoNotOpenYetIcon from "@/components/icons/CompRegoNotOpenYetIcon";
import CompRegoNotOpenYetGreyIcon from "@/components/icons/CompRegoNotOpenYet_greyIcon";
import CompRegoOpenDateIcon from "@/components/icons/CompRegoOpenDateIcon";
import CompRegoCloseDateIcon from "@/components/icons/CompRegoCloseDateIcon";
import CompetitorsIcon from "@/components/icons/CompetitorsIcon";
import ContactIcon from "@/components/icons/ContactIcon";
import DelegateReportIcon from "@/components/icons/DelegateReportIcon";
import DetailsIcon from "@/components/icons/DetailsIcon";
import DeveloperExportIcon from "@/components/icons/DeveloperExportIcon";
import DisciplinaryLogIcon from "@/components/icons/DisciplinaryLogIcon";
import DisclaimerIcon from "@/components/icons/DisclaimerIcon";
import DownloadIcon from "@/components/icons/DownloadIcon";
import EditIcon from "@/components/icons/EditIcon";
import EducationalResourcesIcon from "@/components/icons/EducationalResourcesIcon";
import ErrorIcon from "@/components/icons/ErrorIcon";
import ExternalLinkIcon from "@/components/icons/ExternalLinkIcon";
import FacebookIcon from "@/components/icons/FacebookIcon";
import FiltersIcon from "@/components/icons/FiltersIcon";
import GitHubIcon from "@/components/icons/GithubIcon";
import GuidelinesIcon from "@/components/icons/GuidelinesIcon";
import HelpAndFaqsIcon from "@/components/icons/HelpAndFaqsIcon";
import IncidentsLogIcon from "@/components/icons/IncidentsLogIcon";
import InformationIcon from "@/components/icons/InformationIcon";
import InstagramIcon from "@/components/icons/InstagramIcon";
import LanguageIcon from "@/components/icons/LanguageIcon";
import ListIcon from "@/components/icons/ListIcon";
import LocationIcon from "@/components/icons/LocationIcon";
import ManageTabsIcon from "@/components/icons/ManageTabsIcon";
import MapIcon from "@/components/icons/MapIcon";
import MediaSubmissionIcon from "@/components/icons/MediaSubmissionIcon";
import MenuIcon from "@/components/icons/MenuIcon";
import MultimediaIcon from "@/components/icons/MultimediaIcon";
import MyCompsIcon from "@/components/icons/MyCompsIcon";
import MyResultsIcon from "@/components/icons/MyResultsIcon";
import NationalChampionshipIcon from "@/components/icons/NationalChampionshipIcon";
import NewCompIcon from "@/components/icons/NewCompIcon";
import OnTheSpotRegistrationIcon from "@/components/icons/OnTheSpotRegistrationIcon";
import PaymentIcon from "@/components/icons/PaymentIcon";
import PrivacyIcon from "@/components/icons/PrivacyIcon";
import RankingsIcon from "@/components/icons/RankingsIcon";
import RecordsIcon from "@/components/icons/RecordsIcon";
import RegionalOrganisationsIcon from "@/components/icons/RegionalOrganisationsIcon";
import RegisterIcon from "@/components/icons/RegisterIcon";
import RegistrationIcon from "@/components/icons/RegistrationIcon";
import RegulationsAndGuidelinesIcon from "@/components/icons/RegulationsAndGuidelinesIcon";
import RegulationsHistoryIcon from "@/components/icons/RegulationsHistoryIcon";
import RegulationsIcon from "@/components/icons/RegulationsIcon";
import ResultsExportIcon from "@/components/icons/ResultsExportIcon";
import ScramblesIcon from "@/components/icons/ScramblesIcon";
import SearchIcon from "@/components/icons/SearchIcon";
import SpectatorsIcon from "@/components/icons/SpectatorsIcon";
import SpeedcubingHistoryIcon from "@/components/icons/SpeedcubingHistoryIcon";
import SpotsLeftIcon from "@/components/icons/SpotsLeftIcon";
import StatisticsIcon from "@/components/icons/StatisticsIcon";
import TeamsCommitteesAndCouncilsIcon from "@/components/icons/TeamsCommitteesAndCouncilsIcon";
import ToolsIcon from "@/components/icons/ToolsIcon";
import TranslatorsIcon from "@/components/icons/TranslatorsIcon";
import TwitchIcon from "@/components/icons/TwitchIcon";
import UserIcon from "@/components/icons/UserIcon";
import UsersPersonsIcon from "@/components/icons/UsersPersonsIcon";
import VenueIcon from "@/components/icons/VenueIcon";
import WcaDelegatesIcon from "@/components/icons/WcaDelegatesIcon";
import WcaDocsIcon from "@/components/icons/WcaDocsIcon";
import WcaLiveIcon from "@/components/icons/WcaLiveIcon";
import WcaOfficersAndBoardIcon from "@/components/icons/WcaOfficersAndBoardIcon";
import WeiboIcon from "@/components/icons/WeiboIcon";
import XIcon from "@/components/icons/XIcon";
import YouTubeIcon from "@/components/icons/YoutubeIcon";


export default function Home() {
  const { data: session } = useSession();
  const permissions = usePermissions();

  return (
    <Container centerContent>
      {session ? (
        <>
          <Text>Welcome, {session.user?.name}</Text>
          <Button onClick={() => signOut()}>Sign out</Button>
          {permissions && (
            <Code as="pre">{JSON.stringify(permissions, null, 2)}</Code>
          )}
        </>
      ) : (
        <Button onClick={() => signIn("WCA")} colorPalette="blue">Sign in</Button>
      )}
      <Text>Test Links:</Text>
      <HStack>
      <ChakraLink asChild variant="plainLink">
        <Link href="competitions/OC2024">
          <Button variant="outline">OC2024</Button>
        </Link>
      </ChakraLink>
      <ChakraLink asChild variant="plainLink">
        <Link href="competitions/WC2025">
          <Button variant="outline" colorPalette="red">WC2025</Button>
        </Link>
      </ChakraLink>
      <ChakraLink asChild variant="plainLink">
        <Link href="persons/2022ANDE01">
          <Button variant="outline" colorPalette="red">2022ANDE01</Button>
        </Link>
      </ChakraLink>
      </HStack>
      <Card.Root>
      <Card.Body>
        <Box mb="4">
          <Text fontSize="xl" fontWeight="bold">WCA Icon Gallery</Text>
        </Box>
        <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 6 }} spacing={6}>
          <Box textAlign="center">
            <LocationIcon size="lg" color="textPrimary" />
            <Text mt="2" fontSize="sm">LocationIcon</Text>
          </Box>
          <Box textAlign="center">
            <AboutTheWcaIcon size="lg" color="textPrimary" />
            <Text mt="2" fontSize="sm">AboutTheWcaIcon</Text>
          </Box>
          <Box textAlign="center">
            <WcaLiveIcon size="lg" color="textPrimary" />
            <Text mt="2" fontSize="sm">WcaLiveIcon</Text>
          </Box>
          <Box textAlign="center">
            <TwitchIcon size="lg" color="textPrimary" />
            <Text mt="2" fontSize="sm">TwitchIcon</Text>
          </Box>
          <Box textAlign="center">
            <MyResultsIcon size="lg" color="textPrimary" />
            <Text mt="2" fontSize="sm">MyResultsIcon</Text>
          </Box>
          {/* Repeat the same structure for each icon */}
          {/* Example for additional icons */}
          {[
            AboutTheRegulationsIcon,
            AdminResultsIcon,
            AllCompsIcon,
            BookmarkIcon,
            CloneIcon,
            CompNotStartedIcon,
            CompRegoClosedIcon,
            CompRegoClosedRedIcon,
            CompRegoFullButOpenIcon,
            CompRegoFullButOpenOrangeIcon,
            CompRegoNotFullOpenIcon,
            CompRegoNotFullOpenGreenIcon,
            CompRegoNotOpenYetIcon,
            CompRegoNotOpenYetGreyIcon,
            CompRegoOpenDateIcon,
            CompRegoCloseDateIcon,
            CompetitorsIcon,
            ContactIcon,
            DelegateReportIcon,
            DetailsIcon,
            DeveloperExportIcon,
            DisciplinaryLogIcon,
            DisclaimerIcon,
            DownloadIcon,
            EditIcon,
            EducationalResourcesIcon,
            ErrorIcon,
            ExternalLinkIcon,
            FacebookIcon,
            FiltersIcon,
            GitHubIcon,
            GuidelinesIcon,
            HelpAndFaqsIcon,
            IncidentsLogIcon,
            InformationIcon,
            InstagramIcon,
            LanguageIcon,
            ListIcon,
            ManageTabsIcon,
            MapIcon,
            MediaSubmissionIcon,
            MenuIcon,
            MultimediaIcon,
            MyCompsIcon,
            NationalChampionshipIcon,
            NewCompIcon,
            OnTheSpotRegistrationIcon,
            PaymentIcon,
            PrivacyIcon,
            RankingsIcon,
            RecordsIcon,
            RegionalOrganisationsIcon,
            RegisterIcon,
            RegistrationIcon,
            RegulationsAndGuidelinesIcon,
            RegulationsHistoryIcon,
            RegulationsIcon,
            ResultsExportIcon,
            ScramblesIcon,
            SearchIcon,
            SpectatorsIcon,
            SpeedcubingHistoryIcon,
            SpotsLeftIcon,
            StatisticsIcon,
            TeamsCommitteesAndCouncilsIcon,
            ToolsIcon,
            TranslatorsIcon,
            UserIcon,
            UsersPersonsIcon,
            VenueIcon,
            WcaDelegatesIcon,
            WcaDocsIcon,
            WcaOfficersAndBoardIcon,
            WeiboIcon,
            XIcon,
            YouTubeIcon
          ].map((IconComponent, index) => (
            <Box textAlign="center" key={index}>
              <IconComponent size="lg" color="textPrimary" />
              <Text mt="2" fontSize="sm">{IconComponent.name}</Text>
            </Box>
          ))}
        </SimpleGrid>
      </Card.Body>
    </Card.Root>
    </Container>
  );
}
