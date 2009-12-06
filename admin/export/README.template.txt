Dump of the World Cube Association results database			
Date:	[longDate]		
Remarks:	none		
Contact:	Ron van Bruchem	Netherlands	rbruchem@worldcubeassociation.org
Website:	http://www.worldcubeassociation.org/results		
Description:	This file contains public information on all official WCA competitions, WCA members and WCA competition results.		
Goal:	Goal of this file is for members of our community to do analysis on the information for statistical and personal purposes.		
Allowed use:	Information and parts of it may be published online, but only under the following conditions:		
	# a clearly visible link to World Cube Association website is added (http://www.worldcubeassociation.org) with the notification that World Cube Association is the source and owner of the information		
	# a clearly visible notification is added that the published information is not actual information		
	# a clearly visible link to http://www.worldcubeassociation.org/results is added with the notification that the actual information can be found via that link		
	# a clearly visible notification which date is taken for the source of the data		
	# the style and format of the information must be clearly distinguishable from the official WCA website		
			
Software created by:	Clément Gallet	France	
	Stefan Pochmann	Germany	
	Josef Jelinek	Czech Republic	
	Ron van Bruchem	Netherlands	
			
Queries:	select * from Results;		
	select id, name, cityName, countryId, information, year, month, day, endMonth, endDay, eventSpecs, wcaDelegate, organiser, venue, venueAddress, venueDetails, website, cellName, latitude, longitude from Competitions;		
	select id, subid, name, countryId, gender from Persons;		
	select * from Rounds;		
	select * from Events;		
	select * from Formats;		
	select * from Countries;		
	select * from Continents;		
			
Table structures:	CREATE TABLE `Competitions` (
  `id` varchar(32) NOT NULL default '',
  `name` varchar(50) NOT NULL default '',
  `cityName` varchar(50) NOT NULL default '',
  `countryId` varchar(50) NOT NULL default '',
  `information` mediumtext,
  `year` smallint(5) unsigned NOT NULL default '0',
  `month` smallint(5) unsigned NOT NULL default '0',
  `day` smallint(5) unsigned NOT NULL default '0',
  `endMonth` smallint(5) unsigned NOT NULL default '0',
  `endDay` smallint(5) unsigned NOT NULL default '0',
  `eventSpecs` text NOT NULL,
  `wcaDelegate` varchar(240) NOT NULL default '',
  `organiser` varchar(200) NOT NULL default '',
  `venue` varchar(240) NOT NULL default '',
  `venueAddress` varchar(120) default NULL,
  `venueDetails` varchar(120) default NULL,
  `website` varchar(200) default NULL,
  `cellName` varchar(45) NOT NULL default '',
  `showAtAll` tinyint(1) NOT NULL default '1',
  `showResults` tinyint(1) NOT NULL default '1',
  `password` varchar(45) NOT NULL default '',
  `showPreregForm` tinyint(1) NOT NULL default '0',
  `showPreregList` tinyint(1) NOT NULL default '0',
  `latitude` int(11) NOT NULL default '0',
  `longitude` int(11) NOT NULL default '0',
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;		
	CREATE TABLE `Continents` (
  `id` varchar(50) NOT NULL default '',
  `name` varchar(50) NOT NULL default '',
  `recordName` char(3) NOT NULL default '',
  `latitude` int(11) NOT NULL default '0',
  `longitude` int(11) NOT NULL default '0',
  `zoom` tinyint(4) NOT NULL default '0',
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;		
	CREATE TABLE `Countries` (
  `id` varchar(50) NOT NULL default '',
  `name` varchar(50) NOT NULL default '',
  `continentId` varchar(50) NOT NULL default '',
  `latitude` int(11) NOT NULL default '0',
  `longitude` int(11) NOT NULL default '0',
  `zoom` tinyint(4) NOT NULL default '0',
  PRIMARY KEY  (`id`),
  KEY `fk_continents` (`continentId`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;		
	CREATE TABLE `Events` (
  `id` varchar(6) NOT NULL default '',
  `name` varchar(54) NOT NULL default '',
  `rank` int(11) NOT NULL default '0',
  `format` varchar(10) NOT NULL default '',
  `cellName` varchar(45) NOT NULL default '',
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1 PACK_KEYS=0;		
	CREATE TABLE `Formats` (
  `id` char(1) NOT NULL default '',
  `name` varchar(50) NOT NULL default '',
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;		
	CREATE TABLE `Persons` (
  `id` varchar(10) NOT NULL default '',
  `subId` tinyint(6) NOT NULL default '1',
  `name` varchar(80) NOT NULL default '',
  `countryId` varchar(50) NOT NULL default '',
  `gender` char(1) NOT NULL default '',
  `year` smallint(6) NOT NULL default '0',
  `month` tinyint(4) NOT NULL default '0',
  `day` tinyint(4) NOT NULL default '0',
  `comments` varchar(40) NOT NULL default '',
  KEY `fk_country` (`countryId`),
  KEY `id` (`id`),
  KEY `name` (`name`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;		
	CREATE TABLE `Results` (
  `id` int(11) NOT NULL auto_increment,
  `pos` smallint(6) NOT NULL default '0',
  `personId` varchar(10) NOT NULL default '',
  `personName` varchar(80) NOT NULL default '',
  `countryId` varchar(50) default NULL,
  `competitionId` varchar(32) NOT NULL default '',
  `eventId` varchar(6) NOT NULL default '',
  `roundId` char(1) NOT NULL default '',
  `formatId` char(1) NOT NULL default '',
  `value1` int(11) NOT NULL default '0',
  `value2` int(11) NOT NULL default '0',
  `value3` int(11) NOT NULL default '0',
  `value4` int(11) NOT NULL default '0',
  `value5` int(11) NOT NULL default '0',
  `best` int(11) NOT NULL default '0',
  `average` int(11) NOT NULL default '0',
  `regionalSingleRecord` char(3) default NULL,
  `regionalAverageRecord` char(3) default NULL,
  PRIMARY KEY  (`id`),
  KEY `fk_tournament` (`competitionId`),
  KEY `fk_event` (`eventId`),
  KEY `fk_round` (`roundId`),
  KEY `fk_format` (`formatId`),
  KEY `fk_competitor` USING BTREE (`personId`)
) ENGINE=MyISAM AUTO_INCREMENT=66847 DEFAULT CHARSET=latin1 PACK_KEYS=0 AUTO_INCREMENT=66847 ;		
	CREATE TABLE `Rounds` (
  `id` char(1) NOT NULL default '',
  `rank` int(11) NOT NULL default '0',
  `name` varchar(50) NOT NULL default '',
  `cellName` varchar(45) NOT NULL default '',
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;		
