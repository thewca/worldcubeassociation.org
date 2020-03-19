
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `Competitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Competitions` (
  `id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `cityName` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `countryId` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `information` mediumtext COLLATE utf8mb4_unicode_ci,
  `year` smallint(5) unsigned NOT NULL DEFAULT '0',
  `month` smallint(5) unsigned NOT NULL DEFAULT '0',
  `day` smallint(5) unsigned NOT NULL DEFAULT '0',
  `endMonth` smallint(5) unsigned NOT NULL DEFAULT '0',
  `endDay` smallint(5) unsigned NOT NULL DEFAULT '0',
  `venue` varchar(240) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `venueAddress` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `venueDetails` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `external_website` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cellName` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `showAtAll` tinyint(1) NOT NULL DEFAULT '0',
  `latitude` int(11) DEFAULT NULL,
  `longitude` int(11) DEFAULT NULL,
  `contact` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `registration_open` datetime DEFAULT NULL,
  `registration_close` datetime DEFAULT NULL,
  `use_wca_registration` tinyint(1) NOT NULL DEFAULT '1',
  `guests_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `results_posted_at` datetime DEFAULT NULL,
  `results_nag_sent_at` datetime DEFAULT NULL,
  `generate_website` tinyint(1) DEFAULT NULL,
  `announced_at` datetime DEFAULT NULL,
  `base_entry_fee_lowest_denomination` int(11) DEFAULT NULL,
  `currency_code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'USD',
  `endYear` smallint(6) NOT NULL DEFAULT '0',
  `connected_stripe_account_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `enable_donations` tinyint(1) DEFAULT NULL,
  `competitor_limit_enabled` tinyint(1) DEFAULT NULL,
  `competitor_limit` int(11) DEFAULT NULL,
  `competitor_limit_reason` text COLLATE utf8mb4_unicode_ci,
  `extra_registration_requirements` text COLLATE utf8mb4_unicode_ci,
  `on_the_spot_registration` tinyint(1) DEFAULT NULL,
  `on_the_spot_entry_fee_lowest_denomination` int(11) DEFAULT NULL,
  `refund_policy_percent` int(11) DEFAULT NULL,
  `refund_policy_limit_date` datetime DEFAULT NULL,
  `guests_entry_fee_lowest_denomination` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `results_submitted_at` datetime DEFAULT NULL,
  `early_puzzle_submission` tinyint(1) DEFAULT NULL,
  `early_puzzle_submission_reason` text COLLATE utf8mb4_unicode_ci,
  `qualification_results` tinyint(1) DEFAULT NULL,
  `qualification_results_reason` text COLLATE utf8mb4_unicode_ci,
  `name_reason` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `external_registration_page` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `confirmed_at` datetime DEFAULT NULL,
  `event_restrictions` tinyint(1) DEFAULT NULL,
  `event_restrictions_reason` text COLLATE utf8mb4_unicode_ci,
  `registration_reminder_sent_at` datetime DEFAULT NULL,
  `announced_by` int(11) DEFAULT NULL,
  `results_posted_by` int(11) DEFAULT NULL,
  `main_event_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `year_month_day` (`year`,`month`,`day`),
  KEY `index_Competitions_on_countryId` (`countryId`),
  KEY `index_Competitions_on_start_date` (`start_date`),
  KEY `index_Competitions_on_end_date` (`end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
