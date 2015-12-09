-- MySQL dump 10.13  Distrib 5.5.46, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: cubing
-- ------------------------------------------------------
-- Server version	5.5.46-0ubuntu0.14.04.2

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
  `eventSpecs` text COLLATE utf8_unicode_ci NOT NULL,
  `venue` varchar(240) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `venueAddress` varchar(120) COLLATE utf8_unicode_ci DEFAULT NULL,
  `venueDetails` varchar(120) COLLATE utf8_unicode_ci DEFAULT NULL,
  `website` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `cellName` varchar(45) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `showAtAll` tinyint(1) NOT NULL DEFAULT '0',
  `showPreregForm` tinyint(1) NOT NULL DEFAULT '0',
  `showPreregList` tinyint(1) NOT NULL DEFAULT '0',
  `latitude` int(11) NOT NULL DEFAULT '0',
  `longitude` int(11) NOT NULL DEFAULT '0',
  `isConfirmed` tinyint(1) NOT NULL DEFAULT '0',
  `contact` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `remarks` text COLLATE utf8_unicode_ci,
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
) ENGINE=InnoDB AUTO_INCREMENT=11553 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
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
  `latitude` int(11) NOT NULL DEFAULT '0',
  `longitude` int(11) NOT NULL DEFAULT '0',
  `zoom` tinyint(4) NOT NULL DEFAULT '0',
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
  PRIMARY KEY (`id`,`subId`),
  KEY `Persons_fk_country` (`countryId`),
  KEY `Persons_id` (`id`),
  KEY `Persons_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Preregs`
--

DROP TABLE IF EXISTS `Preregs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Preregs` (
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
  `guests` text COLLATE utf8_unicode_ci NOT NULL,
  `comments` text COLLATE utf8_unicode_ci NOT NULL,
  `ip` varchar(16) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `status` char(1) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `eventIds` text COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=85131 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=120402 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=145702 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
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
  PRIMARY KEY (`id`),
  KEY `Results_fk_tournament` (`competitionId`),
  KEY `Results_fk_event` (`eventId`),
  KEY `Results_fk_format` (`formatId`),
  KEY `Results_fk_round` (`roundId`),
  KEY `Results_eventAndAverage` (`eventId`,`average`),
  KEY `Results_eventAndBest` (`eventId`,`best`),
  KEY `Results_regionalAverageRecordCheckSpeedup` (`eventId`,`competitionId`,`roundId`,`countryId`,`average`),
  KEY `Results_regionalSingleRecordCheckSpeedup` (`eventId`,`competitionId`,`roundId`,`countryId`,`best`),
  KEY `Results_fk_competitor` (`personId`)
) ENGINE=InnoDB AUTO_INCREMENT=911100 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci PACK_KEYS=1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ResultsStatus`
--

DROP TABLE IF EXISTS `ResultsStatus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ResultsStatus` (
  `id` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `value` varchar(50) COLLATE utf8_unicode_ci NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=218489 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=4468 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=459 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=244 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=239 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `index_oauth_applications_on_uid` (`uid`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=5082 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
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
  `wca_website_team` tinyint(1) DEFAULT NULL,
  `results_team` tinyint(1) DEFAULT NULL,
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
  `wdc_team` tinyint(1) DEFAULT NULL,
  `wdc_team_leader` tinyint(1) DEFAULT NULL,
  `wrc_team` tinyint(1) DEFAULT NULL,
  `wrc_team_leader` tinyint(1) DEFAULT NULL,
  `results_team_leader` tinyint(1) DEFAULT NULL,
  `wca_website_team_leader` tinyint(1) DEFAULT NULL,
  `software_admin_team` tinyint(1) DEFAULT NULL,
  `software_admin_team_leader` tinyint(1) DEFAULT NULL,
  `unconfirmed_wca_id` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `delegate_id_to_handle_wca_id_request` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `index_users_on_email` (`email`),
  UNIQUE KEY `index_users_on_reset_password_token` (`reset_password_token`),
  UNIQUE KEY `index_users_on_wca_id` (`wca_id`),
  KEY `index_users_on_senior_delegate_id` (`senior_delegate_id`),
  KEY `index_users_on_delegate_id_to_handle_wca_id_request` (`delegate_id_to_handle_wca_id_request`)
) ENGINE=InnoDB AUTO_INCREMENT=6625 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2015-12-09 22:57:32
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

INSERT INTO schema_migrations (version) VALUES ('20151209003851');

