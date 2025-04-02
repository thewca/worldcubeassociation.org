"use server";

import React from "react";
import { Button, HStack, IconButton, Menu, Text } from "@chakra-ui/react";
import { getPayload } from "payload";
import config from "@payload-config";
import Link from "next/link";
import { RefreshRouteOnSave } from "@/components/RefreshRouteOnSave";
import { ColorModeButton } from "@/components/ui/color-mode";
import { LuChevronDown, LuHouse } from "react-icons/lu";

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

const iconMap: Record<string, React.ComponentType> = {
  "About the Regulations": AboutTheRegulationsIcon,
  "About the WCA": AboutTheWcaIcon,
  "Admin Results": AdminResultsIcon,
  "All Competitions": AllCompsIcon,
  Bookmark: BookmarkIcon,
  Clone: CloneIcon,
  "Competition Not Started": CompNotStartedIcon,
  "Registration Closed": CompRegoClosedIcon,
  "Registration Closed (Red)": CompRegoClosedRedIcon,
  "Registration Full but Open": CompRegoFullButOpenIcon,
  "Registration Full but Open (Orange)": CompRegoFullButOpenOrangeIcon,
  "Registration Not Full, Open": CompRegoNotFullOpenIcon,
  "Registration Not Full, Open (Green)": CompRegoNotFullOpenGreenIcon,
  "Registration Not Open Yet": CompRegoNotOpenYetIcon,
  "Registration Not Open Yet (Grey)": CompRegoNotOpenYetGreyIcon,
  "Registration Open Date": CompRegoOpenDateIcon,
  "Registration Close Date": CompRegoCloseDateIcon,
  Competitors: CompetitorsIcon,
  Contact: ContactIcon,
  "Delegate Report": DelegateReportIcon,
  Details: DetailsIcon,
  "Developer Export": DeveloperExportIcon,
  "Disciplinary Log": DisciplinaryLogIcon,
  Disclaimer: DisclaimerIcon,
  Download: DownloadIcon,
  Edit: EditIcon,
  "Educational Resources": EducationalResourcesIcon,
  Error: ErrorIcon,
  "External Link": ExternalLinkIcon,
  Facebook: FacebookIcon,
  Filters: FiltersIcon,
  GitHub: GitHubIcon,
  Guidelines: GuidelinesIcon,
  "Help and FAQs": HelpAndFaqsIcon,
  "Incidents Log": IncidentsLogIcon,
  Information: InformationIcon,
  Instagram: InstagramIcon,
  Language: LanguageIcon,
  List: ListIcon,
  Location: LocationIcon,
  "Manage Tabs": ManageTabsIcon,
  Map: MapIcon,
  "Media Submission": MediaSubmissionIcon,
  Menu: MenuIcon,
  Multimedia: MultimediaIcon,
  "My Competitions": MyCompsIcon,
  "My Results": MyResultsIcon,
  "National Championship": NationalChampionshipIcon,
  "New Competition": NewCompIcon,
  "On-the-Spot Registration": OnTheSpotRegistrationIcon,
  Payment: PaymentIcon,
  Privacy: PrivacyIcon,
  Rankings: RankingsIcon,
  Records: RecordsIcon,
  "Regional Organisations": RegionalOrganisationsIcon,
  Register: RegisterIcon,
  Registration: RegistrationIcon,
  "Regulations and Guidelines": RegulationsAndGuidelinesIcon,
  "Regulations History": RegulationsHistoryIcon,
  Regulations: RegulationsIcon,
  "Results Export": ResultsExportIcon,
  Scrambles: ScramblesIcon,
  Search: SearchIcon,
  Spectators: SpectatorsIcon,
  "Speedcubing History": SpeedcubingHistoryIcon,
  "Spots Left": SpotsLeftIcon,
  Statistics: StatisticsIcon,
  "Teams, Committees and Councils": TeamsCommitteesAndCouncilsIcon,
  Tools: ToolsIcon,
  Translators: TranslatorsIcon,
  Twitch: TwitchIcon,
  User: UserIcon,
  "Users / Persons": UsersPersonsIcon,
  Venue: VenueIcon,
  "WCA Delegates": WcaDelegatesIcon,
  "WCA Documents": WcaDocsIcon,
  "WCA Live": WcaLiveIcon,
  "WCA Officers and Board": WcaOfficersAndBoardIcon,
  Weibo: WeiboIcon,
  "X (formerly Twitter)": XIcon,
  YouTube: YouTubeIcon,
};

interface IconDisplayProps {
  name: IconName;
}

const IconDisplay: React.FC<IconDisplayProps> = ({ name }) => {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    return <div>Icon not found</div>; // Optional fallback
  }

  return <IconComponent />;
};

export default async function Navbar() {
  const payload = await getPayload({ config });
  const navbar = await payload.findGlobal({ slug: "nav" });

  return (
    <HStack
      borderBottom="md"
      padding="3"
      justifyContent="space-between"
      bg="bg"
    >
      <RefreshRouteOnSave />
      <HStack>
        <IconButton asChild variant="ghost">
          <Link href={"/"}>
            <LuHouse />
          </Link>
        </IconButton>
        {navbar.entry.map((navbarEntry) => (
          <React.Fragment key={navbarEntry.id}>
            {navbarEntry.blockType === "LinkItem" && (
              <Button asChild variant="ghost" size="sm">
                <Link href={navbarEntry.targetLink}>
                  <IconDisplay name={navbarEntry.displayIcon} />
                  {navbarEntry.displayText}
                </Link>
              </Button>
            )}
            {navbarEntry.blockType === "NavDropdown" && (
              <Menu.Root>
                <Menu.Trigger asChild>
                  <Button variant="ghost" size="sm">
                    <IconDisplay name={navbarEntry.displayIcon} />
                    {navbarEntry.title}
                    <LuChevronDown />
                  </Button>
                </Menu.Trigger>
                <Menu.Positioner>
                  <Menu.Content>
                    {navbarEntry.entries.map((subEntry) => (
                      <React.Fragment key={subEntry.id}>
                        {subEntry.blockType === "LinkItem" && (
                          <Menu.Item value={subEntry.id!} asChild>
                            <Link href={subEntry.targetLink}>
                              <IconDisplay name={navbarEntry.displayIcon} />
                              {subEntry.displayText}
                            </Link>
                          </Menu.Item>
                        )}
                        {subEntry.blockType === "VisualDivider" && (
                          <Menu.Separator />
                        )}
                        {subEntry.blockType === "NestedDropdown" && (
                          <Menu.Root
                            positioning={{
                              placement: "right-start",
                              gutter: -2,
                            }}
                          >
                            <Menu.TriggerItem>
                              {subEntry.title}
                            </Menu.TriggerItem>
                            <Menu.Positioner>
                              <Menu.Content>
                                {subEntry.entries.map((nestedEntry) => (
                                  <React.Fragment key={nestedEntry.id}>
                                    {nestedEntry.blockType === "LinkItem" && (
                                      <Menu.Item value={nestedEntry.id!}>
                                        <Link href={nestedEntry.targetLink}>
                                          <IconDisplay
                                            name={navbarEntry.displayIcon}
                                          />
                                          {nestedEntry.displayText}
                                        </Link>
                                      </Menu.Item>
                                    )}
                                  </React.Fragment>
                                ))}
                              </Menu.Content>
                            </Menu.Positioner>
                          </Menu.Root>
                        )}
                      </React.Fragment>
                    ))}
                  </Menu.Content>
                </Menu.Positioner>
              </Menu.Root>
            )}
          </React.Fragment>
        ))}
      </HStack>
      <HStack>
        {navbar.entry.length === 0 && (
          <Text>Oh no, there are no navbar items!</Text>
        )}
      </HStack>
      <HStack>
        <ColorModeButton />
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin">Payload CMS</Link>
        </Button>
      </HStack>
    </HStack>
  );
}
