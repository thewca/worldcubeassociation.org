-- MySQL dump 10.16  Distrib 10.1.16-MariaDB, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: wca_development
-- ------------------------------------------------------
-- Server version	10.1.16-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Competitions`
--

DROP TABLE IF EXISTS `Competitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Competitions` (
  `id` varchar(32) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `name` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `cityName` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `countryId` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `information` mediumtext COLLATE utf8_unicode_ci,
  `year` smallint(5) unsigned NOT NULL DEFAULT '0',
  `month` smallint(5) unsigned NOT NULL DEFAULT '0',
  `day` smallint(5) unsigned NOT NULL DEFAULT '0',
  `endMonth` smallint(5) unsigned NOT NULL DEFAULT '0',
  `endDay` smallint(5) unsigned NOT NULL DEFAULT '0',
  `venue` varchar(240) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `venueAddress` varchar(120) COLLATE utf8_unicode_ci DEFAULT NULL,
  `venueDetails` varchar(120) COLLATE utf8_unicode_ci DEFAULT NULL,
  `external_website` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `cellName` varchar(45) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `showAtAll` tinyint(1) NOT NULL DEFAULT '0',
  `latitude` int(11) DEFAULT NULL,
  `longitude` int(11) DEFAULT NULL,
  `isConfirmed` tinyint(1) NOT NULL DEFAULT '0',
  `contact` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `remarks` text COLLATE utf8_unicode_ci,
  `registration_open` datetime DEFAULT NULL,
  `registration_close` datetime DEFAULT NULL,
  `use_wca_registration` tinyint(1) NOT NULL DEFAULT '0',
  `guests_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `results_posted_at` datetime DEFAULT NULL,
  `results_nag_sent_at` datetime DEFAULT NULL,
  `generate_website` tinyint(1) DEFAULT NULL,
  `announced_at` datetime DEFAULT NULL,
  `base_entry_fee_lowest_denomination` int(11) DEFAULT NULL,
  `currency_code` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `endYear` smallint(6) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `year_month_day` (`year`,`month`,`day`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `CompetitionsMedia`
--

DROP TABLE IF EXISTS `CompetitionsMedia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `CompetitionsMedia` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `competitionId` varchar(32) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `type` varchar(15) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `text` varchar(100) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `uri` text COLLATE utf8_unicode_ci NOT NULL,
  `submitterName` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `submitterComment` text COLLATE utf8_unicode_ci NOT NULL,
  `submitterEmail` varchar(45) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `timestampSubmitted` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `timestampDecided` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `status` varchar(10) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ConciseAverageResults`
--

DROP TABLE IF EXISTS `ConciseAverageResults`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ConciseAverageResults` (
  `id` int(11) NOT NULL DEFAULT '0',
  `average` int(11) NOT NULL DEFAULT '0',
  `valueAndId` bigint(22) DEFAULT NULL,
  `personId` varchar(10) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `eventId` varchar(6) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `countryId` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `continentId` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `year` smallint(5) unsigned NOT NULL DEFAULT '0',
  `month` smallint(5) unsigned NOT NULL DEFAULT '0',
  `day` smallint(5) unsigned NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ConciseSingleResults`
--

DROP TABLE IF EXISTS `ConciseSingleResults`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ConciseSingleResults` (
  `id` int(11) NOT NULL DEFAULT '0',
  `best` int(11) NOT NULL DEFAULT '0',
  `valueAndId` bigint(22) DEFAULT NULL,
  `personId` varchar(10) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `eventId` varchar(6) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `countryId` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `continentId` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `year` smallint(5) unsigned NOT NULL DEFAULT '0',
  `month` smallint(5) unsigned NOT NULL DEFAULT '0',
  `day` smallint(5) unsigned NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Continents`
--

DROP TABLE IF EXISTS `Continents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Continents` (
  `id` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `name` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `recordName` char(3) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `latitude` int(11) NOT NULL DEFAULT '0',
  `longitude` int(11) NOT NULL DEFAULT '0',
  `zoom` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Countries`
--

DROP TABLE IF EXISTS `Countries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Countries` (
  `id` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `name` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `continentId` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `iso2` char(2) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `iso2` (`iso2`),
  KEY `fk_continents` (`continentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Events`
--

DROP TABLE IF EXISTS `Events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Events` (
  `id` varchar(6) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `name` varchar(54) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `rank` int(11) NOT NULL DEFAULT '0',
  `format` varchar(10) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `cellName` varchar(45) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci PACK_KEYS=0;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Formats`
--

DROP TABLE IF EXISTS `Formats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Formats` (
  `id` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `name` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `sort_by` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `sort_by_second` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `expected_solve_count` int(11) NOT NULL,
  `trim_fastest_n` int(11) NOT NULL,
  `trim_slowest_n` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `InboxPersons`
--

DROP TABLE IF EXISTS `InboxPersons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `InboxPersons` (
  `id` varchar(10) COLLATE utf8_unicode_ci NOT NULL,
  `wcaId` varchar(10) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `name` varchar(80) COLLATE utf8_unicode_ci DEFAULT NULL,
  `countryId` char(2) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `gender` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `dob` date NOT NULL,
  `competitionId` varchar(32) COLLATE utf8_unicode_ci NOT NULL,
  KEY `InboxPersons_fk_country` (`countryId`),
  KEY `InboxPersons_id` (`wcaId`),
  KEY `InboxPersons_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `InboxResults`
--

DROP TABLE IF EXISTS `InboxResults`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `InboxResults` (
  `personId` varchar(20) COLLATE utf8_unicode_ci NOT NULL,
  `pos` smallint(6) NOT NULL DEFAULT '0',
  `competitionId` varchar(32) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `eventId` varchar(6) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `roundId` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `formatId` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `value1` int(11) NOT NULL DEFAULT '0',
  `value2` int(11) NOT NULL DEFAULT '0',
  `value3` int(11) NOT NULL DEFAULT '0',
  `value4` int(11) NOT NULL DEFAULT '0',
  `value5` int(11) NOT NULL DEFAULT '0',
  `best` int(11) NOT NULL DEFAULT '0',
  `average` int(11) NOT NULL DEFAULT '0',
  KEY `InboxResults_fk_tournament` (`competitionId`),
  KEY `InboxResults_fk_event` (`eventId`),
  KEY `InboxResults_fk_format` (`formatId`),
  KEY `InboxResults_fk_round` (`roundId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci PACK_KEYS=0;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Persons`
--

DROP TABLE IF EXISTS `Persons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Persons` (
  `id` varchar(10) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `subId` tinyint(6) NOT NULL DEFAULT '1',
  `name` varchar(80) COLLATE utf8_unicode_ci DEFAULT NULL,
  `countryId` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `gender` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `year` smallint(6) NOT NULL DEFAULT '0',
  `month` tinyint(4) NOT NULL DEFAULT '0',
  `day` tinyint(4) NOT NULL DEFAULT '0',
  `comments` varchar(40) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `rails_id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`rails_id`),
  UNIQUE KEY `index_Persons_on_id_and_subId` (`id`,`subId`),
  KEY `Persons_fk_country` (`countryId`),
  KEY `Persons_id` (`id`),
  KEY `Persons_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=143 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `RanksAverage`
--

DROP TABLE IF EXISTS `RanksAverage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `RanksAverage` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `personId` varchar(10) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `eventId` varchar(6) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `best` int(11) NOT NULL DEFAULT '0',
  `worldRank` int(11) NOT NULL DEFAULT '0',
  `continentRank` int(11) NOT NULL DEFAULT '0',
  `countryRank` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_persons` (`personId`),
  KEY `fk_events` (`eventId`)
) ENGINE=InnoDB AUTO_INCREMENT=197 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `RanksSingle`
--

DROP TABLE IF EXISTS `RanksSingle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `RanksSingle` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `personId` varchar(10) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `eventId` varchar(6) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `best` int(11) NOT NULL DEFAULT '0',
  `worldRank` int(11) NOT NULL DEFAULT '0',
  `continentRank` int(11) NOT NULL DEFAULT '0',
  `countryRank` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_persons` (`personId`),
  KEY `fk_events` (`eventId`)
) ENGINE=InnoDB AUTO_INCREMENT=197 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Results`
--

DROP TABLE IF EXISTS `Results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Results` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pos` smallint(6) NOT NULL DEFAULT '0',
  `personId` varchar(10) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `personName` varchar(80) COLLATE utf8_unicode_ci DEFAULT NULL,
  `countryId` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `competitionId` varchar(32) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `eventId` varchar(6) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `roundId` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `formatId` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `value1` int(11) NOT NULL DEFAULT '0',
  `value2` int(11) NOT NULL DEFAULT '0',
  `value3` int(11) NOT NULL DEFAULT '0',
  `value4` int(11) NOT NULL DEFAULT '0',
  `value5` int(11) NOT NULL DEFAULT '0',
  `best` int(11) NOT NULL DEFAULT '0',
  `average` int(11) NOT NULL DEFAULT '0',
  `regionalSingleRecord` char(3) COLLATE utf8_unicode_ci DEFAULT NULL,
  `regionalAverageRecord` char(3) COLLATE utf8_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `Results_fk_tournament` (`competitionId`),
  KEY `Results_fk_event` (`eventId`),
  KEY `Results_fk_format` (`formatId`),
  KEY `Results_fk_round` (`roundId`),
  KEY `Results_eventAndAverage` (`eventId`,`average`),
  KEY `Results_eventAndBest` (`eventId`,`best`),
  KEY `Results_regionalAverageRecordCheckSpeedup` (`eventId`,`competitionId`,`roundId`,`countryId`,`average`),
  KEY `Results_regionalSingleRecordCheckSpeedup` (`eventId`,`competitionId`,`roundId`,`countryId`,`best`),
  KEY `Results_fk_competitor` (`personId`),
  KEY `index_Results_on_competitionId_and_updated_at` (`competitionId`,`updated_at`)
) ENGINE=InnoDB AUTO_INCREMENT=863293 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci PACK_KEYS=1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Rounds`
--

DROP TABLE IF EXISTS `Rounds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Rounds` (
  `id` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `rank` int(11) NOT NULL DEFAULT '0',
  `name` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `cellName` varchar(45) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `final` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Scrambles`
--

DROP TABLE IF EXISTS `Scrambles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Scrambles` (
  `scrambleId` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `competitionId` varchar(32) COLLATE utf8_unicode_ci NOT NULL COMMENT 'matches Competitions.id',
  `eventId` varchar(6) COLLATE utf8_unicode_ci NOT NULL COMMENT 'matches Events.id',
  `roundId` char(1) COLLATE utf8_unicode_ci NOT NULL COMMENT 'matches Rounds.id',
  `groupId` varchar(3) COLLATE utf8_unicode_ci NOT NULL COMMENT 'from A to ZZZ',
  `isExtra` tinyint(1) NOT NULL,
  `scrambleNum` int(11) NOT NULL,
  `scramble` varchar(500) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`scrambleId`),
  KEY `competitionId` (`competitionId`,`eventId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `competition_delegates`
--

DROP TABLE IF EXISTS `competition_delegates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `competition_delegates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `competition_id` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `delegate_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `receive_registration_emails` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `index_competition_delegates_on_competition_id_and_delegate_id` (`competition_id`,`delegate_id`),
  KEY `index_competition_delegates_on_competition_id` (`competition_id`),
  KEY `index_competition_delegates_on_delegate_id` (`delegate_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6257 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `competition_events`
--

DROP TABLE IF EXISTS `competition_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `competition_events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `competition_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `event_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `index_competition_events_on_competition_id_and_event_id` (`competition_id`,`event_id`),
  KEY `fk_rails_ba6cfdafb1` (`event_id`),
  CONSTRAINT `fk_rails_ba6cfdafb1` FOREIGN KEY (`event_id`) REFERENCES `Events` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9350 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `competition_organizers`
--

DROP TABLE IF EXISTS `competition_organizers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `competition_organizers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `competition_id` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `organizer_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `receive_registration_emails` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_competition_organizers_on_competition_id_and_organizer_id` (`competition_id`,`organizer_id`),
  KEY `index_competition_organizers_on_competition_id` (`competition_id`),
  KEY `index_competition_organizers_on_organizer_id` (`organizer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6300 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `competition_tabs`
--

DROP TABLE IF EXISTS `competition_tabs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `competition_tabs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `competition_id` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `content` text COLLATE utf8_unicode_ci,
  `display_order` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `index_competition_tabs_on_display_order_and_competition_id` (`display_order`,`competition_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `completed_jobs`
--

DROP TABLE IF EXISTS `completed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `completed_jobs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `priority` int(11) NOT NULL DEFAULT '0',
  `attempts` int(11) NOT NULL DEFAULT '0',
  `handler` text COLLATE utf8_unicode_ci NOT NULL,
  `run_at` datetime DEFAULT NULL,
  `queue` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `delayed_jobs`
--

DROP TABLE IF EXISTS `delayed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `delayed_jobs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `priority` int(11) NOT NULL DEFAULT '0',
  `attempts` int(11) NOT NULL DEFAULT '0',
  `handler` text COLLATE utf8_unicode_ci NOT NULL,
  `last_error` text COLLATE utf8_unicode_ci,
  `run_at` datetime DEFAULT NULL,
  `locked_at` datetime DEFAULT NULL,
  `failed_at` datetime DEFAULT NULL,
  `locked_by` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `queue` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `delayed_jobs_priority` (`priority`,`run_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `delegate_reports`
--

DROP TABLE IF EXISTS `delegate_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `delegate_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `competition_id` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `equipment` text COLLATE utf8_unicode_ci,
  `venue` text COLLATE utf8_unicode_ci,
  `organisation` text COLLATE utf8_unicode_ci,
  `schedule_url` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `incidents` text COLLATE utf8_unicode_ci,
  `remarks` text COLLATE utf8_unicode_ci,
  `discussion_url` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `posted_by_user_id` int(11) DEFAULT NULL,
  `posted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `index_delegate_reports_on_competition_id` (`competition_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1003 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `oauth_access_grants`
--

DROP TABLE IF EXISTS `oauth_access_grants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `oauth_access_grants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `resource_owner_id` int(11) NOT NULL,
  `application_id` int(11) NOT NULL,
  `token` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `expires_in` int(11) NOT NULL,
  `redirect_uri` text COLLATE utf8_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `scopes` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `index_oauth_access_grants_on_token` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `oauth_access_tokens`
--

DROP TABLE IF EXISTS `oauth_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `oauth_access_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `resource_owner_id` int(11) DEFAULT NULL,
  `application_id` int(11) DEFAULT NULL,
  `token` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `refresh_token` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `expires_in` int(11) DEFAULT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `scopes` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `index_oauth_access_tokens_on_token` (`token`),
  UNIQUE KEY `index_oauth_access_tokens_on_refresh_token` (`refresh_token`),
  KEY `index_oauth_access_tokens_on_resource_owner_id` (`resource_owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `oauth_applications`
--

DROP TABLE IF EXISTS `oauth_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `oauth_applications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `uid` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `secret` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `redirect_uri` text COLLATE utf8_unicode_ci NOT NULL,
  `scopes` varchar(255) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `owner_id` int(11) DEFAULT NULL,
  `owner_type` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `index_oauth_applications_on_uid` (`uid`),
  KEY `index_oauth_applications_on_owner_id_and_owner_type` (`owner_id`,`owner_type`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `old_registrations`
--

DROP TABLE IF EXISTS `old_registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `old_registrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `competitionId` varchar(32) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `name` varchar(80) COLLATE utf8_unicode_ci DEFAULT NULL,
  `personId` varchar(10) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `countryId` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `gender` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `birthYear` smallint(6) unsigned NOT NULL DEFAULT '0',
  `birthMonth` tinyint(4) unsigned NOT NULL DEFAULT '0',
  `birthDay` tinyint(4) unsigned NOT NULL DEFAULT '0',
  `email` varchar(80) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `guests_old` text COLLATE utf8_unicode_ci,
  `comments` text COLLATE utf8_unicode_ci NOT NULL,
  `ip` varchar(16) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `user_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `guests` int(11) NOT NULL DEFAULT '0',
  `accepted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `index_registrations_on_competitionId_and_user_id` (`competitionId`,`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=86141 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `poll_options`
--

DROP TABLE IF EXISTS `poll_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `poll_options` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `description` varchar(200) COLLATE utf8_unicode_ci NOT NULL,
  `poll_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `poll_id` (`poll_id`) USING BTREE,
  CONSTRAINT `poll_options_ibfk_1` FOREIGN KEY (`poll_id`) REFERENCES `polls` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `polls`
--

DROP TABLE IF EXISTS `polls`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `polls` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question` text COLLATE utf8_unicode_ci NOT NULL,
  `multiple` tinyint(1) NOT NULL,
  `deadline` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `comment` text COLLATE utf8_unicode_ci,
  `confirmed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `body` text COLLATE utf8_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `sticky` tinyint(1) NOT NULL DEFAULT '0',
  `author_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `world_readable` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `index_posts_on_slug` (`slug`),
  KEY `index_posts_on_world_readable_and_sticky_and_created_at` (`world_readable`,`sticky`,`created_at`),
  KEY `index_posts_on_world_readable_and_created_at` (`world_readable`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=5126 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `preferred_formats`
--

DROP TABLE IF EXISTS `preferred_formats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `preferred_formats` (
  `event_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `format_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `ranking` int(11) NOT NULL,
  UNIQUE KEY `index_preferred_formats_on_event_id_and_format_id` (`event_id`,`format_id`),
  KEY `fk_rails_c3e0098ed3` (`format_id`),
  CONSTRAINT `fk_rails_8d2986d7ea` FOREIGN KEY (`event_id`) REFERENCES `Events` (`id`),
  CONSTRAINT `fk_rails_c3e0098ed3` FOREIGN KEY (`format_id`) REFERENCES `Formats` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary table structure for view `rails_persons`
--

DROP TABLE IF EXISTS `rails_persons`;
/*!50001 DROP VIEW IF EXISTS `rails_persons`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE TABLE `rails_persons` (
  `id` tinyint NOT NULL,
  `wca_id` tinyint NOT NULL,
  `subId` tinyint NOT NULL,
  `name` tinyint NOT NULL,
  `countryId` tinyint NOT NULL,
  `gender` tinyint NOT NULL,
  `year` tinyint NOT NULL,
  `month` tinyint NOT NULL,
  `day` tinyint NOT NULL,
  `comments` tinyint NOT NULL
) ENGINE=MyISAM */;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `registration_competition_events`
--

DROP TABLE IF EXISTS `registration_competition_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `registration_competition_events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `registration_id` int(11) DEFAULT NULL,
  `competition_event_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_registration_competition_events_on_reg_id_and_comp_event_id` (`registration_id`,`competition_event_id`),
  KEY `index_reg_events_reg_id_comp_event_id` (`registration_id`,`competition_event_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18568 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `registrations`
--

DROP TABLE IF EXISTS `registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `registrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `competition_id` varchar(32) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `comments` text COLLATE utf8_unicode_ci NOT NULL,
  `ip` varchar(16) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `user_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `guests` int(11) NOT NULL DEFAULT '0',
  `accepted_at` datetime DEFAULT NULL,
  `accepted_by` int(11) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=86147 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `schema_migrations`
--

DROP TABLE IF EXISTS `schema_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `schema_migrations` (
  `version` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  UNIQUE KEY `unique_schema_migrations` (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `team_members`
--

DROP TABLE IF EXISTS `team_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `team_members` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `team_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `team_leader` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `teams`
--

DROP TABLE IF EXISTS `teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `teams` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `friendly_id` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `description` text COLLATE utf8_unicode_ci,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_preferred_events`
--

DROP TABLE IF EXISTS `user_preferred_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_preferred_events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `event_id` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `index_user_preferred_events_on_user_id_and_event_id` (`user_id`,`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `encrypted_password` varchar(255) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `reset_password_token` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `reset_password_sent_at` datetime DEFAULT NULL,
  `remember_created_at` datetime DEFAULT NULL,
  `sign_in_count` int(11) NOT NULL DEFAULT '0',
  `current_sign_in_at` datetime DEFAULT NULL,
  `last_sign_in_at` datetime DEFAULT NULL,
  `current_sign_in_ip` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `last_sign_in_ip` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `confirmation_token` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `confirmed_at` datetime DEFAULT NULL,
  `confirmation_sent_at` datetime DEFAULT NULL,
  `unconfirmed_email` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `delegate_status` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `senior_delegate_id` int(11) DEFAULT NULL,
  `region` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `wca_id` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `avatar` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `pending_avatar` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `saved_avatar_crop_x` int(11) DEFAULT NULL,
  `saved_avatar_crop_y` int(11) DEFAULT NULL,
  `saved_avatar_crop_w` int(11) DEFAULT NULL,
  `saved_avatar_crop_h` int(11) DEFAULT NULL,
  `saved_pending_avatar_crop_x` int(11) DEFAULT NULL,
  `saved_pending_avatar_crop_y` int(11) DEFAULT NULL,
  `saved_pending_avatar_crop_w` int(11) DEFAULT NULL,
  `saved_pending_avatar_crop_h` int(11) DEFAULT NULL,
  `unconfirmed_wca_id` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `delegate_id_to_handle_wca_id_claim` int(11) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `gender` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `country_iso2` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `results_notifications_enabled` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `index_users_on_email` (`email`),
  UNIQUE KEY `index_users_on_reset_password_token` (`reset_password_token`),
  UNIQUE KEY `index_users_on_wca_id` (`wca_id`),
  KEY `index_users_on_senior_delegate_id` (`senior_delegate_id`),
  KEY `index_users_on_delegate_id_to_handle_wca_id_claim` (`delegate_id_to_handle_wca_id_claim`)
) ENGINE=InnoDB AUTO_INCREMENT=6302 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vote_options`
--

DROP TABLE IF EXISTS `vote_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vote_options` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vote_id` int(11) NOT NULL,
  `poll_option_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `votes`
--

DROP TABLE IF EXISTS `votes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `votes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `comment` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `poll_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `index_votes_on_user_id` (`user_id`),
  CONSTRAINT `votes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Final view structure for view `rails_persons`
--

/*!50001 DROP TABLE IF EXISTS `rails_persons`*/;
/*!50001 DROP VIEW IF EXISTS `rails_persons`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `rails_persons` AS select `Persons`.`rails_id` AS `id`,`Persons`.`id` AS `wca_id`,`Persons`.`subId` AS `subId`,`Persons`.`name` AS `name`,`Persons`.`countryId` AS `countryId`,`Persons`.`gender` AS `gender`,`Persons`.`year` AS `year`,`Persons`.`month` AS `month`,`Persons`.`day` AS `day`,`Persons`.`comments` AS `comments` from `Persons` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2016-09-13 14:33:17
INSERT INTO schema_migrations (version) VALUES ('20150501004846');

INSERT INTO schema_migrations (version) VALUES ('20150504022234');

INSERT INTO schema_migrations (version) VALUES ('20150504163657');

INSERT INTO schema_migrations (version) VALUES ('20150520080634');

INSERT INTO schema_migrations (version) VALUES ('20150521000833');

INSERT INTO schema_migrations (version) VALUES ('20150521001340');

INSERT INTO schema_migrations (version) VALUES ('20150521005227');

INSERT INTO schema_migrations (version) VALUES ('20150521225109');

INSERT INTO schema_migrations (version) VALUES ('20150526035517');

INSERT INTO schema_migrations (version) VALUES ('20150601061358');

INSERT INTO schema_migrations (version) VALUES ('20150601224750');

INSERT INTO schema_migrations (version) VALUES ('20150602044759');

INSERT INTO schema_migrations (version) VALUES ('20150602062127');

INSERT INTO schema_migrations (version) VALUES ('20150602233220');

INSERT INTO schema_migrations (version) VALUES ('20150603015039');

INSERT INTO schema_migrations (version) VALUES ('20150718020058');

INSERT INTO schema_migrations (version) VALUES ('20150718020123');

INSERT INTO schema_migrations (version) VALUES ('20150806172310');

INSERT INTO schema_migrations (version) VALUES ('20150812014543');

INSERT INTO schema_migrations (version) VALUES ('20150819064257');

INSERT INTO schema_migrations (version) VALUES ('20150821164902');

INSERT INTO schema_migrations (version) VALUES ('20150826003626');

INSERT INTO schema_migrations (version) VALUES ('20150831195312');

INSERT INTO schema_migrations (version) VALUES ('20150903083847');

INSERT INTO schema_migrations (version) VALUES ('20150904062512');

INSERT INTO schema_migrations (version) VALUES ('20150908183742');

INSERT INTO schema_migrations (version) VALUES ('20150924011143');

INSERT INTO schema_migrations (version) VALUES ('20150924011919');

INSERT INTO schema_migrations (version) VALUES ('20150924155057');

INSERT INTO schema_migrations (version) VALUES ('20151001191340');

INSERT INTO schema_migrations (version) VALUES ('20151008211834');

INSERT INTO schema_migrations (version) VALUES ('20151014220307');

INSERT INTO schema_migrations (version) VALUES ('20151116195414');

INSERT INTO schema_migrations (version) VALUES ('20151117183214');

INSERT INTO schema_migrations (version) VALUES ('20151119063335');

INSERT INTO schema_migrations (version) VALUES ('20151119072940');

INSERT INTO schema_migrations (version) VALUES ('20151207230222');

INSERT INTO schema_migrations (version) VALUES ('20151209003851');

INSERT INTO schema_migrations (version) VALUES ('20151213232440');

INSERT INTO schema_migrations (version) VALUES ('20151214000352');

INSERT INTO schema_migrations (version) VALUES ('20151215193124');

INSERT INTO schema_migrations (version) VALUES ('20151217001125');

INSERT INTO schema_migrations (version) VALUES ('20151217054555');

INSERT INTO schema_migrations (version) VALUES ('20151217062612');

INSERT INTO schema_migrations (version) VALUES ('20151222013017');

INSERT INTO schema_migrations (version) VALUES ('20151230174411');

INSERT INTO schema_migrations (version) VALUES ('20160109070723');

INSERT INTO schema_migrations (version) VALUES ('20160120071503');

INSERT INTO schema_migrations (version) VALUES ('20160128023834');

INSERT INTO schema_migrations (version) VALUES ('20160218135313');

INSERT INTO schema_migrations (version) VALUES ('20160218234447');

INSERT INTO schema_migrations (version) VALUES ('20160223204831');

INSERT INTO schema_migrations (version) VALUES ('20160224013453');

INSERT INTO schema_migrations (version) VALUES ('20160303144700');

INSERT INTO schema_migrations (version) VALUES ('20160305170821');

INSERT INTO schema_migrations (version) VALUES ('20160406192349');

INSERT INTO schema_migrations (version) VALUES ('20160407005537');

INSERT INTO schema_migrations (version) VALUES ('20160407210623');

INSERT INTO schema_migrations (version) VALUES ('20160504170758');

INSERT INTO schema_migrations (version) VALUES ('20160504230105');

INSERT INTO schema_migrations (version) VALUES ('20160505231300');

INSERT INTO schema_migrations (version) VALUES ('20160513162613');

INSERT INTO schema_migrations (version) VALUES ('20160514124545');

INSERT INTO schema_migrations (version) VALUES ('20160514141051');

INSERT INTO schema_migrations (version) VALUES ('20160517140653');

INSERT INTO schema_migrations (version) VALUES ('20160518020433');

INSERT INTO schema_migrations (version) VALUES ('20160518045741');

INSERT INTO schema_migrations (version) VALUES ('20160520230353');

INSERT INTO schema_migrations (version) VALUES ('20160528071910');

INSERT INTO schema_migrations (version) VALUES ('20160531124049');

INSERT INTO schema_migrations (version) VALUES ('20160602105428');

INSERT INTO schema_migrations (version) VALUES ('20160610191605');

INSERT INTO schema_migrations (version) VALUES ('20160616183719');

INSERT INTO schema_migrations (version) VALUES ('20160627215744');

INSERT INTO schema_migrations (version) VALUES ('20160701034833');

INSERT INTO schema_migrations (version) VALUES ('20160705120632');

INSERT INTO schema_migrations (version) VALUES ('20160705121551');

INSERT INTO schema_migrations (version) VALUES ('20160727000015');

INSERT INTO schema_migrations (version) VALUES ('20160731181145');

INSERT INTO schema_migrations (version) VALUES ('20160811013347');

INSERT INTO schema_migrations (version) VALUES ('20160825124202');

INSERT INTO schema_migrations (version) VALUES ('20160831212003');

INSERT INTO schema_migrations (version) VALUES ('20160901120254');

INSERT INTO schema_migrations (version) VALUES ('20160902230822');

INSERT INTO schema_migrations (version) VALUES ('20160914122252');

INSERT INTO schema_migrations (version) VALUES ('20160930213354');

INSERT INTO schema_migrations (version) VALUES ('20161011005956');

INSERT INTO schema_migrations (version) VALUES ('20161018220122');

INSERT INTO schema_migrations (version) VALUES ('20161026201019');

INSERT INTO schema_migrations (version) VALUES ('20161031215932');

INSERT INTO schema_migrations (version) VALUES ('20161117085757');

INSERT INTO schema_migrations (version) VALUES ('20161118141833');

INSERT INTO schema_migrations (version) VALUES ('20161122162029');

INSERT INTO schema_migrations (version) VALUES ('20161122014040');

INSERT INTO schema_migrations (version) VALUES ('20161206204738');
