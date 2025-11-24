/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.11-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: wca_db    Database: wca_dump_results
-- ------------------------------------------------------
-- Server version	8.4.3

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
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
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Competitions` (
  `id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `cityName` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `countryId` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `information` mediumtext COLLATE utf8mb4_unicode_ci,
  `year` smallint unsigned NOT NULL DEFAULT '0',
  `month` smallint unsigned NOT NULL DEFAULT '0',
  `day` smallint unsigned NOT NULL DEFAULT '0',
  `endMonth` smallint unsigned NOT NULL DEFAULT '0',
  `endDay` smallint unsigned NOT NULL DEFAULT '0',
  `cancelled` int NOT NULL DEFAULT '0',
  `eventSpecs` longtext COLLATE utf8mb4_unicode_ci,
  `wcaDelegate` mediumtext COLLATE utf8mb4_unicode_ci,
  `organiser` mediumtext COLLATE utf8mb4_unicode_ci,
  `venue` varchar(240) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `venueAddress` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `venueDetails` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `external_website` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cellName` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `latitude` int DEFAULT NULL,
  `longitude` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Competitions`
--

LOCK TABLES `Competitions` WRITE;
/*!40000 ALTER TABLE `Competitions` DISABLE KEYS */;
INSERT INTO `Competitions` VALUES
('100Merito2018','100º Mérito 2018','Santarém, Pará','Brazil','Qualquer pessoa que resolva o Cubo Mágico em menos de 10 minutos deve participar. Venha se divertir com a gente!\r\n\r\nPor favor, inscreva-se antecipadamente. Instruções na aba de inscrições.',2018,4,14,4,14,0,'222 333 333bf 333ft 444 pyram skewb','[{Rafael de Andrade Cinoto}{mailto:247@worldcubeassociation.org}]','[{Davi de Andrade Iácono}{mailto:14973@worldcubeassociation.org}]','[Mérito Pré-Vestibulares](https://www.facebook.com/meritoprevestibulares/)','Avenida Mendonça Furtado, 1120 - CEP: 68040050','Próximo ao Colégio São Francisco',NULL,'100º Mérito 2018',-2422498,-54712597),
('100YearsRepublicAnkara2023','100 Years Republic Ankara 2023','Ankara','Turkey','[TR]\r\nKayıt sırasında adınızı ve soyadınızı lütfen kimlikte yazıldığı gibi hatasız giriniz. İlk harfleri büyük yazınız.\r\nYarışmaya gelirken yanınızda kimlik bulundurmayı unutmayınız. **Lütfen sekmeleri okuyunuz.** \r\n\r\n[EN]\r\nPlease enter your name and surname during registration as it is written on your ID.\r\nThe First letters are capital letters.\r\nDont forget to have an ID card with you when you come to the competition. **Please read all the tabs.**',2023,10,28,10,29,0,'222 333 333oh 444 555 clock pyram skewb sq1','[{Can Ersoy}{mailto:20111@worldcubeassociation.org}]','[{İskender Aznavur}{mailto:295@worldcubeassociation.org}] [{Tuncer Efe Doğan}{mailto:274740@worldcubeassociation.org}]','TMMOB Teoman Öztürk Öğrenci Evi ve Sosyal Tesisi','Mehmet Akif Ersoy, 295. Sk. No:6, 06200 Yenimahalle/Ankara','6.kat / 6th floor',NULL,'100 Years Republic Ankara 2023',39964026,32766238),
('100YearsRepublicIstanbul2023','100 Years Republic İstanbul 2023','İstanbul','Turkey','[TR]\r\nKayıt sırasında adınızı ve soyadınızı lütfen kimlikte yazıldığı gibi hatasız giriniz. İlk harfleri büyük yazınız.\r\nYarışmaya gelirken yanınızda kimlik bulundurmayı unutmayınız. **Lütfen sekmeleri okuyunuz.** \r\n\r\n[EN]\r\nPlease enter your name and surname during registration as it is written on your ID.\r\nThe First letters are capital letters.\r\nDont forget to have an ID card with you when you come to the competition. **Please read all the tabs.**',2023,10,28,10,29,0,'222 333 333bf 333oh 444 555 clock pyram skewb sq1','[{Mustafa Çamlıca}{mailto:131142@worldcubeassociation.org}] [{Ömer Çetinkaya}{mailto:20033@worldcubeassociation.org}]','[{Alper Şakım}{mailto:148950@worldcubeassociation.org}] [{İskender Aznavur}{mailto:295@worldcubeassociation.org}] [{Toprak Berva Yıldırım}{mailto:225114@worldcubeassociation.org}]','[Bil Koleji Ümraniye Yerleşkesi](https://bilokullari.com.tr/umraniye-bil-koleji)','Cemil Meriç, Alemdağ Cd No:321, 34771 Dudullu Osb/Ümraniye/İstanbul','Yemek katı',NULL,'100 Years Republic İstanbul 2023',41016582,29142873),
('100YilMBACubeWeekend2023','100. Yıl MBA Cube Weekend 2023','İstanbul','Turkey','[TR]\r\nKayıt sırasında adınızı ve soyadınızı lütfen kimlikte yazıldığı gibi hatasız giriniz. İlk harfleri büyük yazınız.\r\nYarışmaya gelirken yanınızda kimlik bulundurmayı unutmayınız. **Lütfen sekmeleri okuyunuz.** \r\n\r\n[EN]\r\nPlease enter your name and surname during registration as it is written on your ID.\r\nThe First letters are capital letters.\r\nDont forget to have an ID card with you when you come to the competition. **Please read all the tabs.**',2023,12,16,12,17,0,'222 333 333bf 333oh 444 555 666 777 clock minx pyram skewb sq1','[{Mustafa Çamlıca}{mailto:131142@worldcubeassociation.org}] [{Ömer Çetinkaya}{mailto:20033@worldcubeassociation.org}] [{Tuncer Efe Doğan}{mailto:274740@worldcubeassociation.org}]','[{Alper Şakım}{mailto:148950@worldcubeassociation.org}] [{İskender Aznavur}{mailto:295@worldcubeassociation.org}] [{Muhammed Volkan Güngör}{mailto:102909@worldcubeassociation.org}]','[MBA Okulları Çamlıca Yerleşkesi](https://www.mbaokullari.k12.tr/tr/camlica-kampus)','Küçük Çamlıca, Libadiye Cd. No:30, 34692 Üsküdar/İstanbul','Yemekhane / Dining Hall',NULL,'100. Yıl MBA Cube Weekend 2023',41012107,29074717),
('10AniversarioGuatemala2023','Décimo Aniversario Guatemala 2023','Guatemala City','Guatemala','Ésta es una competencia conmemorativa en honor a haber cumplido 10 años desde la primera competencia en el país en Quetzaltenango 2023.\r\n\r\nThis is a commemorative competition in honor of having completed 10 years since our first competition in the country in Quetzaltenango 2023.',2023,10,14,10,15,1,'222 333 333bf 333oh 444 555 minx pyram','[{Adrián Ramírez}{mailto:327@worldcubeassociation.org}]','[{Nancy Ramírez}{mailto:57504@worldcubeassociation.org}]','[Colegio Caré](https://care.edu.gt/)','23 calle 15-45, zona 13','',NULL,'10 Aniversario Guatemala 2023',14573384,-90525865),
('10doRioGrandedoNorte2018','10º do Rio Grande do Norte 2018','João Câmara, Rio Grande do Norte','Brazil','O valor das inscrições será de R$ 6,00 a serem pagos no dia do campeonato.\r\nSócio da **ANCM** terá inscrição **GRATUITA**\r\n\r\nO evento é aberto a qualquer pessoa de qualquer nacionalidade.\r\nAs inscrições estarão abertas até 30 de novembro de 2018.\r\nPara mais informações consulte a aba Inscrições.',2018,12,15,12,16,0,'222 333 333fm 333oh 444 555 clock minx pyram skewb sq1','[{Pablo Eduardo Nikolais Teixeira Bonifácio da Silva}{mailto:1873@worldcubeassociation.org}]','[{Associacao Norte Rio Grandense Cubo Mágico}{mailto:98953@worldcubeassociation.org}] [{Edvan Pontes de Oliveira}{mailto:5373@worldcubeassociation.org}]','Escola Estadual em Tempo Integral Francisco de Assis Bittencourt','R. João Teixeira, João Câmara - RN, 59550-000','A competição acontecerá no Pátio da escola',NULL,'10º do Rio Grande do Norte 2018',-5536382,-35816234),
('10JohrWilerWurfelfast2024','10 Johr Wiler Würfelfäst 2024','Wil SG','Switzerland','![](https://image.jimcdn.com/app/cms/image/transf/dimension=684x10000:format=png/path/s3a9a136d3c2315ad/image/ibf8eb7faeef2afa2/version/1707248635/image.png)\ndeutsch\n Bitte beachte, dass du nur an einem der beiden Wettbewerbe teilnehmen kannst. Wenn du dich für beide Wettbewerbe anmeldest, so zählt nur die erste Anmeldung und wir werden die zweite (spätere) Anmeldung unverzüglich löschen.\n\nenglish\nPlease note that you can only compete in one of the two competitions. If you register for both competitions, only the first registration will be valid and we will immediately delete the second (later) registration.\n\n\n',2024,3,24,3,24,0,'333 333bf 333oh 444 clock minx','[{Ioannis Papadopoulos}{mailto:18407@worldcubeassociation.org}] [{Mattia Pasquini}{mailto:135257@worldcubeassociation.org}] [{Oleg Gritsenko}{mailto:140@worldcubeassociation.org}]','[{Thomas Stadler}{mailto:1470@worldcubeassociation.org}]','[Stadtsaal Wil](http://www.stadtsaal-wil.ch/)','Bahnhofplatz 6, 9500 Wil SG','Stadtsaal',NULL,'10 Johr Wiler Würfelfäst 2024',47463297,9041582),
('10thAnniversaryCervantes2024','10th Anniversary Cervantes 2024','Montevideo','Uruguay','![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBcElrIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--4be3c11536038145829dbcba17ca15bdea04981e/imagen.png)\n# ![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBaGxIIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--e1a87d9563999f890af638f98836b63b2aac90c5/6u.png) Español \nLímite de competidores: 40.\n\n* Leer el [Reglamento de la WCA](https://www.worldcubeassociation.org/regulations/) para evitar posibles inconvenientes.\n* Esta competencia está abierta a competidores de cualquier nacionalidad, cualquier edad y a nuevos competidores, sin importar sus tiempos de resolución.\n* **COMPETIDORES NUEVOS**: deben leer [Importante](https://www.worldcubeassociation.org/competitions/10thAnniversaryCervantes2024#47610-importante-read) y [Competidores nuevos](https://www.worldcubeassociation.org/competitions/10thAnniversaryCervantes2024#47611-competidores-nuevos-newcomers).\n* Los competidores deben llevar sus propios puzzles.\n* Los competidores deben estar presentes y listos para competir cuando se los llama.\n* Es importante leer toda la información disponible en la página de la competencia.\n\nAnte cualquier duda, consultar a los organizadores o a los delegados de la WCA.\n\n# ![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBaHBIIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--bacb00caed7d0c9177dc3ea7d687667b270ce30d/6i.png) English\nCompetitor limit: 40.\n\n* Read the [WCA Regulations](https://www.worldcubeassociation.org/regulations/) to avoid any issue.\n* This competition is open to competitors of any nationality or age.\n* **NEW COMPETITORS**: You must read [Important](https://www.worldcubeassociation.org/competitions/10thAnniversaryCervantes2024#47610-importante-read) and [New competitors](https://www.worldcubeassociation.org/competitions/10thAnniversaryCervantes2024#47611-competidores-nuevos-newcomers).\n* Competitors must bring their own puzzles.\n* Competitors must be present and ready to compete when called.\n* It is important to read all the information available in the competition\'s website.\n\nFeel free to contact the organizers or the WCA Delegates.',2024,9,14,9,15,0,'222 333 333bf 333mbf 444 444bf 555 555bf 666 777 clock minx pyram skewb','[{Gennaro Monetti}{mailto:48161@worldcubeassociation.org}] [{Manuel Malvárez}{mailto:129654@worldcubeassociation.org}]','[{Asociación Uruguaya de Speedcubing}{mailto:306601@worldcubeassociation.org}] [{Bruno Lezama}{mailto:10398@worldcubeassociation.org}] [{Christian Goñi}{mailto:6130@worldcubeassociation.org}] [{Sofía Rojo}{mailto:312534@worldcubeassociation.org}]','[Colegio Cervantes](https://www.colegiocervantes.edu.uy/)','Maipú 1751, 11600 Montevideo, Departamento de Montevideo','La competencia es en el anexo.',NULL,'10th Anniversary Cervantes 2024',-34895304,-56145318),
('12SidesofSilesia2018','12 Sides of Silesia 2018','Dąbrowa Górnicza','Poland','Limit of competitors: 50.\r\nEntry fee: \r\n20 PLN ',2018,3,3,3,3,0,'333bf 666 777 minx sq1','[{Piotr Trząski}{mailto:14631@worldcubeassociation.org}]','[{Bartłomiej Owczarek}{mailto:5391@worldcubeassociation.org}] [{Jan Zych}{mailto:5390@worldcubeassociation.org}] [{Piotr Trząski}{mailto:14631@worldcubeassociation.org}]','[Centrum Aktywności Obywatelskiej] (http://ngo.dabrowa-gornicza.pl/)','Henryka Sienkiewicza 6A, 41-300 Dąbrowa Górnicza','',NULL,'12 Sides of Silesia 2018',50324482,19179497),
('150thCubeMeetinginBrest2017','150th Cube Meeting in Brest 2017','Brest','Belarus','Registration will be closed on July, 16 or when we reach 70 competitors. Registration fee is (2 + n) BYN (where n is number of events) . Please see the website for more details.',2017,7,22,7,23,0,'222 333 333bf 333fm 333ft 333mbf 333oh 444 444bf 555 555bf 666 777 clock minx pyram skewb sq1','[{Ilya Tsiareshka}{mailto:118@worldcubeassociation.org}]','[{Ilya Tsiareshka}{mailto:118@worldcubeassociation.org}] [{Pavel Bondarovich}{mailto:24117@worldcubeassociation.org}]','[Brest Regional Centre of Olympic Reserve for Rowing](http://www.rowing.brest.by/)','street Oktyabrskoy revolyutsii, 2','On the second floor in conference hall','http://vk.com/cmb150','150 Cube Meeting in Brest 2017',52082331,23741572),
('15AnosSanSilvestre2024','15 Años San Silvestre 2024','Barrancabermeja','Colombia','Organizadores/Organizers:\n\nRafael Jiménez Cabrera\nCarlos Carreño\nHaiver Reyes\n\nPatrocinadores/Sponsors:\n\nCentro Comercial San Silvestre\nSpeedcubing Colombia\n![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBbnQrIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--7d3a37e0c591748214f6708f0d2372dacd516b90/image.png)',2024,7,7,7,7,0,'222 333 333oh 444 pyram skewb','[{Andres Felipe Rodríguez Londoño}{mailto:155647@worldcubeassociation.org}] [{Dennis Rosero}{mailto:5593@worldcubeassociation.org}] [{Haiver Lenin Reyes Garcia}{mailto:71512@worldcubeassociation.org}]','[{Haiver Lenin Reyes Garcia}{mailto:71512@worldcubeassociation.org}] [{Rafael Jiménez Cabrera}{mailto:29553@worldcubeassociation.org}] [{Speedcubing Colombia}{mailto:324522@worldcubeassociation.org}]','Centro Comercial y Empresarial San Silvestre','Diagonal 56 # 18-88','Tercer piso, al frente de cinepolis',NULL,'15 Años San Silvestre 2024',7067333,-73857894),
('1aLordagskubeniVasteras2024','1:a Lördagskuben i Västerås 2024','Västerås','Sweden','Välkomna till 1:a Lördagskuben i Västerås 2024!\r\n\r\nAlla är varmt välkomna att delta, oavsett om du löser kuben på 5 sekunder eller 5 minuter samt oavsett tidigare tävlingserfarenhet.\r\n\r\nVi ber er läsa igenom alla flikar på denna sida eftersom de innehåller mycket värdefull information.\r\n\r\n--\r\n\r\nWelcome to 1:a Lördagskuben i Västerås 2024!\r\n\r\nEveryone is welcome to participate, regardless of whether you solve the cube in 5 seconds or 5 minutes and regardless of prior competition experience.\r\n\r\nWe ask you to read through all the tabs on this page as they contain very valuable information.',2024,2,3,2,3,0,'222 333 333bf 333oh 444 444bf 555 555bf 666 777 clock minx pyram skewb sq1','[{Daniel Wallin}{mailto:567@worldcubeassociation.org}] [{Helmer Ewert}{mailto:13064@worldcubeassociation.org}] [{Peter Hugosson-Miller}{mailto:193382@worldcubeassociation.org}] [{Rasmus Händén}{mailto:18006@worldcubeassociation.org}]','[{Anton Löfberg}{mailto:212140@worldcubeassociation.org}] [{SveKub}{mailto:236778@worldcubeassociation.org}]','Viksängsskolan','Viksängsgatan 23, 723 47 Västerås','Matsalen',NULL,'1:a Lördagskuben i Västerås 2024',59607616,16584644),
('1AVG2013','1 AVG competition 2013','Delft','Netherlands','This, very serious (not an April Fools joke), competition is Arnaud\'s way of saying thank you to all the people that have organised competitions that he has enjoyed so much in the past. It is also the last day that there is only 1 AvG because the next day Aki and Arnaud will get married.',2013,4,1,4,1,0,'222 333 333bf 333oh 444 555 666 777 clock minx pyram sq1','[{Ron van Bruchem}{mailto:1@worldcubeassociation.org}]','[{Arnaud van Galen}{mailto:57606@worldcubeassociation.org}]','[Scouting Paulus](http://scoutingpaulus.nl)','Baden Powellpad 2, Delft','','http://waschbaerli.com/wca/1avg','1 AVG 2013',52010740,4356539),
('1BodyCubing2017','1 Body Cubing 2017','Pueblo, Colorado','USA','$15 base fee (includes 3x3) + $2 for each event after that. Registration fee is non-refundable. There will be an 80 competitor limit.',2017,6,3,6,3,0,'222 333 333oh 444 clock pyram skewb','[{Daniel Hayes}{mailto:258@worldcubeassociation.org}]','[{Joel Davis}{mailto:19091@worldcubeassociation.org}] [{Tristan Steeves}{mailto:54091@worldcubeassociation.org}]','[Rocky Mountain Family Church](http://rmfchurch.org/)','1700 Horseshoe Drive Pueblo, CO, 81001','Signs will be posted','https://www.cubingusa.com/1BodyCubing2017/','1 Body Cubing 2017',38293909,-104592919),
('1stBarpetaCubeOpen2024','1st Barpeta Cube Open 2024','Barpeta, Assam','India','* **Late entries won\'t be allowed to participate. Adhere to the [schedule](https://www.worldcubeassociation.org/competitions/1stBarpetaCubeOpen2024#competition-schedule).**\r\n* **Participants are expected to volunteer when not actively participating.**\r\n* **New-comers are required to bring a valid goverment ID proof document for verification.**',2024,2,4,2,4,0,'222 333 333oh 444 pyram skewb sq1','[{Spondon Nath}{mailto:450@worldcubeassociation.org}]','[{Arif Mahmud}{mailto:50967@worldcubeassociation.org}] [{Ariful Islam Khan}{mailto:401363@worldcubeassociation.org}]','[Sublime Academy, Howly](https://maps.app.goo.gl/gNktE7RRsAo88kLU8)','Howly, Itarvita, Assam 781316','Section A, 2nd floor',NULL,'1st Barpeta Cube Open 2024',26413398,90986591),
('1stDibrugarhOpen2018','1st Dibrugarh Open 2018','Dibrugarh, Assam','India','The competition is open to all competitors. No experience in WCA competitions is necessary, but competitors should be familiar with the regulations and certain event-based time limits will be in place. \r\n\r\n**Steps to register on spot:**\r\nSpot registration will be open from 8:00 a.m to 11:00 am on the day of competition for events that haven\'t started by the time you register.\r\nPlease bring your ID cards for identification at the college gate.\r\n\r\n\r\n\r\nPlease check information regarding payment and schedule under the respective tabs.',2018,11,10,11,10,0,'222 333 333bf 333fm 333oh 444 555 minx pyram sq1','[{Sachin Arvind}{mailto:96587@worldcubeassociation.org}]','[{Kabyanil Talukdar}{mailto:17767@worldcubeassociation.org}] [{Nekibur Zaman}{mailto:126763@worldcubeassociation.org}]','[Dibrugarh University, Dibrugarh](https://www.dibru.ac.in/)','Dibrugarh University, NH-37, Rajapeta, Dibrugarh, Assam 786004','Core Building, DUIET',NULL,'1st Dibrugarh Open 2018',27451715,94890372),
('1stJorhatOpen2019','1st Jorhat Open 2019','Jorhat, Assam','India','The competition is open to all competitors. No experience in WCA competitions is necessary, however competitors should be familiar with the regulations.\r\n',2019,9,14,9,15,0,'222 333 333bf 333fm 333oh 444 555 666 minx','[{Sachin Arvind}{mailto:96587@worldcubeassociation.org}]','[{Naba Kashyap Mudoi}{mailto:167818@worldcubeassociation.org}] [{Yuvraj Gogoi}{mailto:112527@worldcubeassociation.org}]','Jorhat Engineering College','Jorhat Engineering College , Garmur , Jorhat , Assam - 785007','Auditorium ',NULL,'1st Jorhat Open 2019',26745562,94249915),
('1stSalemOpen2022','1st Salem Open 2022','Salem, Tamil Nadu','India','* Kindly bring your ID card while entering the campus.\r\n* Wearing masks all the time and sanitizing hands frequently is mandatory for both Participants and guests. \r\n* If you\'re participating in a WCA competition for first time or unaware of competition rules, make sure that you attend the tutorial session.\r\n* Participants must bring their own cubes.\r\n* Slots left over from Online registrations will be filled through On the spot registrations. The slots will be filled according to First come First serve basis. \r\n* For example: If 75 slots are filled through Online registrations, only 25 slots will be opened for On the spot registrations. So, we recommend the competitors to reserve their place in the competition through online payments. \r\n* If all the 100 slots are filled through Online registrations, then there will not be any On the spot registrations.\r\n* Kindly make your own arrangements for your food. \r\n',2022,6,26,6,26,0,'222 333 333oh pyram','[{Sachin Arvind}{mailto:96587@worldcubeassociation.org}]','[{Mohamed Arif}{mailto:150922@worldcubeassociation.org}] [{Prabu Karthiek}{mailto:255400@worldcubeassociation.org}] [{SpeedCubers India}{mailto:127498@worldcubeassociation.org}] [{Vikram Gopinath}{mailto:119672@worldcubeassociation.org}]','Mukundha International School','DPC Campus, Chettiarkadai Bus Stop, Muthunaicken Patty, Pagalpatty [PO], Salem, Tamil Nadu, 636304','Activity Room, Mukundha International School',NULL,'1st Salem Open 2022',11692463,78064693),
('1stSriLankanOpen2022','1st Sri Lankan Open 2022','Colombo','Sri Lanka','* Make sure you will be available at the venue at least 15 minutes before your event starts. You won\'t be allowed to participate in an event if you reach late. You can refer \"Schedule\" tab to see the starting time of each event.\r\n* If you\'re participating in a WCA competition for the first time or not aware of competition rules, make sure that you attend the tutorial session at 9:00 a.m.\r\n* If you\'re participating in a WCA competition for the first time, please bring your ID card as well. (NIC/Passport/Postal ID/Driving License)\r\n* All participants are expected to volunteer for the event when they are not participating. The roles could be of a judge, runner, or a scrambler, depending upon the situation.\r\n\r\nCOVID-19 Specific Information:\r\n\r\n* Wearing masks, frequently sanitizing hands and following all local goverment health guidelines is mandatory while attending the competition.\r\n* All the participants, guests/spectators should be fully vaccinated (at least two doses). Please bring proof of vaccination with you.\r\n* If you are not vaccinated, you must provide proof of a negative COVID-19 Rapid Antigen test within 72 hours before the start of competition. In case of failing to submit the proof, Organizing team can deny entry to such participants to the competition. And No refund will be allowed in that case.\r\n* We strongly recommend limiting the number of guests you bring for the safety of all attendees. The maximum number of guests that is preferred to accompay a competitor would be limited to TWO.\r\n',2022,4,2,4,2,0,'222 333 333oh 444 555 pyram skewb','[{Sachin Arvind}{mailto:96587@worldcubeassociation.org}]','[{Kalindu Sachintha Wijesundara}{mailto:240870@worldcubeassociation.org}]','Sanora Restaurant and Reception Hall','Sanora Restaurant and Reception Hall, No. 668, Pannipitiya Road, Thalawathugoda, Sri Lanka.','Second Floor, Banquet hall',NULL,'1st Sri Lankan Open 2022',6879843,79934466),
('200Peru2024','200 Perú 2024','Arequipa','Peru','\r\n',2024,7,13,7,13,0,'222 333 333bf 333mbf 333oh 444 minx pyram','[{Helar Gomez Chalco}{mailto:18016@worldcubeassociation.org}] [{Natán Riggenbach}{mailto:79@worldcubeassociation.org}] [{Pedro Luis Mamani Suclla}{mailto:16270@worldcubeassociation.org}]','[{Natán Riggenbach}{mailto:79@worldcubeassociation.org}]','Centro Comercial El Conquistador','Calle Octavio Muñoz Najar 128','',NULL,'200 Perú 2024',-16400538,-71532499),
('24HorasElTambo2024','24 Horas El Tambo 2024','El Tambo','Ecuador','![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MzU3MTYsInB1ciI6ImJsb2JfaWQifX0=--3f5b9b733102d13e16d47fc9b6f3b4238f2758c5/Captura%20de%20pantalla%202024-08-20%20a%20la(s)%208.09.02%E2%80%AFp.%C2%A0m..png)\n🇪🇨\nNota: Tenga en cuenta que esta es una competencia muy especial con condiciones completamente diferentes a las habituales. Será muy agotadora, y recomendamos pensar en si realmente podrá completar la competencia. La competencia no se recomienda para niños pequeños ni para participantes completamente nuevos.\n\n🇺🇸\nNote: Please note that this is a very special competition with completely different conditions than usual. It will be very tiring, and we recommend thinking about whether you will actually be able to complete the competition. The competition is not recommended for younger children or for completely new participants. traduce a espanol',2024,10,12,10,13,0,'222 333 333bf 333fm 333oh 444 555 666 777 clock minx pyram skewb sq1','[{Ronny Morocho}{mailto:69101@worldcubeassociation.org}]','[{Ronny Morocho}{mailto:69101@worldcubeassociation.org}]','Mishki Cafe','Carlos Pinos y Dositeo González ','Cafeteria Mishki ',NULL,'24 Horas El Tambo 2024',-2511812,-78927687),
('24HorasemSalvador2024','24 Horas em Salvador 2024','Salvador, Bahia','Brazil','![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBclp5IiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--3eb495a7327c9da34d21481bc68870f97c1e03ae/image.png)\n\nInscrição de competidor: R$ 50,00\n**Por se tratar de um local com tamanho limitado, será permitido apenas um convidado por competidor, sem a possibilidade de adição de novos convidados** \nLimite de competidores: 40\n​\n​\nRegistration fee: R$ 50,00\n**As the venue has a limited size, it will be permitted a single guest per competitor, without any possibility of the addition of other guests.**\nCompetitor limit: 40\n​\n​\nREGISTRO\nA participação nessa competição requer do competidor o conhecimento dos seguintes requisitos, sem o cumprimento destes, a inscrição não será aceita:\n​\nEstar familiarizado com o Regulamento da WCA;\nSe inscrever através do site da WCA, realizar o pagamento de forma antecipada e mandar o comprovante para o organizador através do e-mail (bahiacubomagico@gmail.com) indicando o nome completo do participante. Detalhes sobre o pagamento da inscrição abaixo.\n​\nAguardar até que o registro eletrônico seja aceito. Caso não participe mesmo com o pagamento, não haverá devolução do dinheiro. \nHá um limite de 40 competidores\nOutras informações adicionais verifique no site da WCA ou entre em contato com o organizador através do e-mail (bahiacubomagico@gmail.com).\n​\nPara os competidores menores de idade que forem ficar desacompanhados durante o período da noite, será necessário o envio de uma autorização de um pai ou responsável autorizando a permanência após este horário.\n\nEsta é uma competição de 24 horas e portanto atente-se a isso. Caso não possa ficar as 24 horas, não há necessidade, preze pela sua saúde e bem-estar mental.\n\nREGISTRATION\nThe participation in this competition requires the comprehension and acceptance of the following requirements, without fulfilling these requirements, the registration will not be accepted:\n​\nRegister through the WCA website, pay in advance and send proof to the organizer via email (bahiacubomagico@gmail.com) indicating the participant\'s full name. More details about the payment below;\n​\nWait for your registration to be approved online. In the case of not participating and having already paid the registration, no money will be returned. \nThere will be a limit of 40 competitors.\nFor additional information, check the WCA website or contact the organizer via email, (bahiacubomagico@gmail.com)\n\nTo underage competitors that will stay alone during the night period, it will be requested an express authorization of a parent or guardian authorizing the competitor\'s participation during said period.\n\nThis is a 24 hour competition, therefore, be attentive to that. In case you\'re not able to stay the 24 hours, there is no need to, value your health and mental well-being.',2024,6,8,6,9,0,'222 333 333bf 333oh 444 555 666 777 clock minx pyram skewb sq1','[{Francisco Thales Rocha Sousa}{mailto:33493@worldcubeassociation.org}] [{João Pedro dos Santos Costa}{mailto:7697@worldcubeassociation.org}] [{João Vinícius Santos}{mailto:37007@worldcubeassociation.org}] [{Kalani Oliveira}{mailto:106027@worldcubeassociation.org}] [{Luan Ferreira}{mailto:60844@worldcubeassociation.org}] [{Marjorie Nunes}{mailto:6196@worldcubeassociation.org}] [{Matheus Casassa}{mailto:42664@worldcubeassociation.org}]','[{Cubo Mágico Bahia}{mailto:57602@worldcubeassociation.org}]','Residência Privada em Stella Maris','Stella Maris','O endereço completo será enviado aos competidores registrados assim que as inscrições fecharem.',NULL,'24 Horas em Salvador 2024',-12943067,-38338084),
('24HoursinAker2024','24 Hours in Åker 2024','Åkers Styckebruk','Sweden','Varmt välkomna till denna 24-timmarstävling i Åkers Styckebruk! \n\nPrecis som vanligt så är alla som önskar varmt välkomna att delta, men vi vill ändå utfärda en kraftig varning kring att tävlingen pågår nonstop i just 24 timmar, och har ett väldigt speciellt koncept. Därför passar tävlingen sannolikt inte varken nya eller yngre deltagare särskilt bra. Läs gärna igenom alla flikar på denna sida så du inte missar någon viktig information, särskilt fliken [koncept](https://www.worldcubeassociation.org/competitions/24HoursinAker2024#43667-koncept-concept).\n\n-----\n\nA warm welcome to this 24-hour competition in Åkers Styckebruk! \n\nJust as usual, everyone who wishes is warmly welcome to participate, but we still want to issue a strong warning that the competition runs non-stop for exactly 24 hours, and has a very special concept. Therefore, the competition probably does not suit neither new or younger participants very well. Please read through all the tabs on this page so you don\'t miss any important information, especially the [concept tab](https://www.worldcubeassociation.org/competitions/24HoursinAker2024#43667-koncept-concept).\n\n[![](https://cuboss.se/wp-content/uploads/2024/01/cuboss-svekub-loggor.png)](https://svekub.se/om_oss/svekub-cuboss/)',2024,7,6,7,7,0,'222 333 333bf 333fm 333mbf 333oh 444 444bf 555 555bf 666 777 clock minx pyram skewb sq1','[{Axel Flordal}{mailto:34633@worldcubeassociation.org}] [{Daniel Wallin}{mailto:567@worldcubeassociation.org}] [{Helmer Ewert}{mailto:13064@worldcubeassociation.org}] [{Leo Lindqvist}{mailto:32202@worldcubeassociation.org}] [{Peter Hugosson-Miller}{mailto:193382@worldcubeassociation.org}]','[{Helmer Ewert}{mailto:13064@worldcubeassociation.org}] [{SveKub}{mailto:236778@worldcubeassociation.org}]','[Folkets Hus](https://www.strangnas.se/uppleva-och-gora/motesplatser/motesplats-akers-styckebruk)','Torget 1, 647 51 Åkers Styckebruk','',NULL,'24 Hours in Åker 2024',59253315,17097545),
('24HoursinFlen2023','24 Hours in Flen 2023','Flen','Sweden','Varmt välkomna till denna 24-timmarstävling i Flen! Precis som vanligt så är alla som önskar varmt välkomna att delta, men vi vill ändå utfärda en kraftig varning kring att tävlingen pågår nonstop i just 24 timmar, och har ett väldigt speciellt koncept. Därför passar tävlingen sannolikt inte varken nya eller yngre deltagare särskilt bra. Läs gärna igenom alla flikar på denna sida så du inte missar någon viktig information, särskilt fliken **koncept**. Notera också att en sängplats (vandrarhemsstandard) över natten samt frukost ingår i anmälningsavgiften, i samma hus som tävlingen genomförs i.\r\n\r\n--\r\n\r\nA warm welcome to this 24-hour competition in Flen! Just as usual, everyone who wishes is warmly welcome to participate, but we still want to issue a strong warning that the competition runs non-stop for exactly 24 hours, and has a very special concept. Therefore, the competition probably does not suit neither new or younger participants very well. Please read through all the tabs on this page so you don\'t miss any important information, especially the **concept** tab. Also note that a hostel style bed and breakfast is included in the registration fee, in the same house as the competition will take place in.',2023,7,22,7,23,0,'222 333 333bf 333fm 333mbf 333oh 444 444bf 555 555bf 666 777 clock minx pyram skewb sq1','[{Daniel Wallin}{mailto:567@worldcubeassociation.org}] [{Helmer Ewert}{mailto:13064@worldcubeassociation.org}] [{Leo Lindqvist}{mailto:32202@worldcubeassociation.org}] [{Peter Hugosson-Miller}{mailto:193382@worldcubeassociation.org}] [{Viktor Zenk}{mailto:17503@worldcubeassociation.org}]','[{Daniel Wallin}{mailto:567@worldcubeassociation.org}] [{SveKub}{mailto:236778@worldcubeassociation.org}] [{Viktor Zenk}{mailto:17503@worldcubeassociation.org}]','Gula Längan','Hammarvallen 3, 642 37 Flen','Common room',NULL,'24 Hours in Flen 2023',59055920,16571369),
('24HoursWarmUpinAstana2024','24 Hours Warm Up in Astana 2024','Astana','Kazakhstan','\n24 Hours Warm Up in Astana 2024 – Астанадағы 24 сағаттық ашық жарыс. Бұл жарыстар 24 сағат үзіліссіз өтеді, сондықтан олар жас және жаңа қатысушыларға ұсынылмайды.\n\nКез келген пәндер санына қатысу мүмкіндігімен базалық жарна 3000 теңгені құрайды. 1 кез келген пәнге тіркелу кезінде тіркеу жарнасы 1000 теңгені құрайды.\n\nБұл жарыстарды QBERS TEAM ұйымдастырады.\n\n\n24 Hours Warm Up in Astana 2024 - это первые открытые 24-х часовые соревнования в Астане. Данные соревнования будут проходить без перерывов 24 часа, следовательно не рекомендуются для юных и новых участников.\n\nБазовый взнос с возможностью участия в любом количестве дисциплин составляет 3000 тенге. При регистрации на 1 любую дисциплину регистрационный взнос составит 1000 тенге.\n\nДанные сореванования организованы QBERS TEAM.\n\n\n24 Hours Warm Up in Astana 2024 is the first open 24-hour competition in Astana. These competitions will take place without breaks for 24 hours, therefore they are not recommended for young and new participants.\n\nThe base registration fee for any number of events is 3000 tenge. If you\'re participating in 1 event only, the registration fee is 1000 tenge.\n\nThese competition is organized by QBERS TEAM.\n\n\n\n\n\n\n',2024,10,19,10,20,0,'222 333 333bf 333fm 333oh 444 555 666 777 clock minx pyram skewb sq1','[{Damir Zhanataev}{mailto:69318@worldcubeassociation.org}]','[{Aidar Nadir}{mailto:188391@worldcubeassociation.org}] [{Damir Issakov}{mailto:127055@worldcubeassociation.org}] [{Damir Zhanataev}{mailto:69318@worldcubeassociation.org}]','Kazakh Research Institute of Processing and Food Industry','Akzhol Avenue 47','Assembly Hall',NULL,'24 Hours Warm Up in Astana 2024',51181817,71460957),
('2aLordagskubeniVasteras2024','2:a Lördagskuben i Västerås 2024','Västerås','Sweden','Välkomna till 2:a Lördagskuben i Västerås 2024!\r\n\r\nAlla är varmt välkomna att delta, oavsett om du löser kuben på 5 sekunder eller 5 minuter samt oavsett tidigare tävlingserfarenhet.\r\n\r\nVi ber er läsa igenom alla flikar på denna sida eftersom de innehåller mycket värdefull information.\r\n\r\n--\r\n\r\nWelcome to 2:a Lördagskuben i Västerås 2024!\r\n\r\nEveryone is welcome to participate, regardless of whether you solve the cube in 5 seconds or 5 minutes and regardless of prior competition experience.\r\n\r\nWe ask you to read through all the tabs on this page as they contain very valuable information.\r\n\r\n[![](https://cuboss.se/wp-content/uploads/2024/01/cuboss-svekub-loggor.png)](https://svekub.se/om_oss/svekub-cuboss/)',2024,3,23,3,23,0,'222 333 333bf 333oh 444 444bf 555 555bf 666 777 clock minx pyram skewb sq1','[{Daniel Wallin}{mailto:567@worldcubeassociation.org}] [{Helmer Ewert}{mailto:13064@worldcubeassociation.org}] [{Peter Hugosson-Miller}{mailto:193382@worldcubeassociation.org}]','[{Anton Löfberg}{mailto:212140@worldcubeassociation.org}] [{SveKub}{mailto:236778@worldcubeassociation.org}]','Viksängsskolan','Viksängsgatan 23, 723 47 Västerås','Matsalen',NULL,'2:a Lördagskuben i Västerås 2024',59607616,16584644),
('2AVG2014','2 AVG competition 2014','Delft','Netherlands','',2014,2,2,2,2,0,'222 333 333bf 333oh 444 444bf 555 555bf skewb','[{Ron van Bruchem}{mailto:1@worldcubeassociation.org}]','[{Aki Kunikoshi (國越晶)}{mailto:118045@worldcubeassociation.org}] [{Arnaud van Galen}{mailto:57606@worldcubeassociation.org}]','[Scouting Paulus](http://scoutingpaulus.nl)','Baden Powellpad 2, Delft','','http://www.waschbaerli.com/wca/2avg/','2 AVG 2014',52010740,4356539),
('2FeetofSnowinMontreal2019','2 Feet of Snow in Montreal 2019','Montréal, Quebec','Canada','**[FR]**\r\nVeuillez consulter les autres onglets pour des informations additionnelles sur la compétition.\r\nNous essaierons de faire une 2e ronde de Clock si on a le temps.\r\n\r\n**[EN]**\r\nPlease see the other tabs for more information about the competition. \r\nWe will try to hold a 2nd round of Clock if time allows.',2019,12,22,12,22,0,'333bf 333ft clock sq1','[{Julien Gaboriaud}{mailto:144333@worldcubeassociation.org}]','[{Daniel Daoust}{mailto:55137@worldcubeassociation.org}] [{Julien Gaboriaud}{mailto:144333@worldcubeassociation.org}]','[Centre St-Pierre](https://www.centrestpierre.org/), #204','1212 Rue Panet, Montréal, QC, H2L 2Y7','La salle 204 est au 2e étage du Centre St-Pierre | Room 204 is on the 2nd floor of Centre St-Pierre',NULL,'2 Feet of Snow in Montreal 2019',45518991,-73553101),
('2FTISanDiego2016','2FTI San Diego 2016','San Diego, California','USA','The cost of registration is $7+2n where n is the number of events you are competing in. Tentative events are free of cost.  $1 per competitor will go towards the WCA and $1 will go towards SoCal cubing expenses.\r\nRegistration closes December 6th at 11:59 PM PST; please be sure to register before then!\r\n\r\nWe **will not** be taking registration at the door.',2016,12,10,12,10,0,'333 333oh 666 777 minx','[{Michael Young}{mailto:255@worldcubeassociation.org}]','[{Andrew Nathenson}{mailto:15997@worldcubeassociation.org}] [{Corey Young}{mailto:7483@worldcubeassociation.org}] [{Henry Helmuth}{mailto:1144@worldcubeassociation.org}] [{Kavin Tangtartharakul}{mailto:16069@worldcubeassociation.org}]','[UCSD](http://universitycenters.ucsd.edu/)','9500 Gilman Drive, San Diego, CA 92093','Price Center West (Ballroom AB)',NULL,'2FTI San Diego 2016',32879713,-117235894),
('2ndGuwahatiOpen2016','2nd Guwahati Open 2016','Guwahati, Assam','India','',2016,5,21,5,22,0,'222 333 333bf 333oh 444 pyram','[{Akula Pavan Kumar}{mailto:5448@worldcubeassociation.org}]','[{Kabyanil Talukdar}{mailto:17767@worldcubeassociation.org}] [{Spondon Nath}{mailto:450@worldcubeassociation.org}]','Foodvilla, Guwahati','Pan Bazar, Guwahati, Assam 781001','','https://guwahatiopenofficial.wordpress.com/','2nd Guwahati Open 2016',26188922,91748125),
('2ndJogjaMiniCompetition2015','2nd Jogja Mini Competition 2015','Yogyakarta, Daerah Istimewa Yogyakarta','Indonesia','This is a small competition after the FMC Asia 2015 (http://tinyurl.com/FMCAsia2015). The registration fee is IDR 50.000 for all events. For more info you can contact Kevin (+6287738957887). ',2015,11,29,11,29,0,'222 333 333bf 333mbf 333oh 444 555','[{Cendy Cahyo Rahmat}{mailto:347@worldcubeassociation.org}]','[{Bintang Kurnia Putra}{mailto:6255@worldcubeassociation.org}] [{Christophorus Kevin Octavio}{mailto:1746@worldcubeassociation.org}]','Balai Warga Perumahan Ambarrukmo Regency','Perumahan Ambarrukmo Regency I, RT 18 RW 02, Gowok, Caturtunggal, Depok, Sleman, Yogyakarta','The venue is not so far from Plaza Ambarukmo (Mall)','http://jmc2015.weebly.com/','2nd Jogja Mini 2015',-7785516,110402686),
('2ndNegrosSpeedcubingOpen2017','2nd Negros Speedcubing Open 2017','Bacolod City, Negros Occidental','Philippines','The competition is open to all interested cubers. This is the second speedcubing competition in the island of Negros. Payment details are emailed within 7days once pre-registration is complete. Kindly follow the instructions as emailed. When doing pre-registration, be sure to accurately list you list of guests.',2017,6,10,6,11,0,'222 333 333bf 333oh 444 555 pyram skewb','[{John Edison Ubaldo (ᜇ᜔ᜌᜓ︀ᜈ᜔ ᜁᜇᜒᜐᜓ︀ᜈ᜔ ᜂᜊᜎ᜔ᜇᜓ︀)}{mailto:349@worldcubeassociation.org}]','[{Jay Benedict Alfaras}{mailto:6986@worldcubeassociation.org}] [{John Edison Ubaldo (ᜇ᜔ᜌᜓ︀ᜈ᜔ ᜁᜇᜒᜐᜓ︀ᜈ᜔ ᜂᜊᜎ᜔ᜇᜓ︀)}{mailto:349@worldcubeassociation.org}]','SM City Bacolod','SM City Bacolod, Reclamation Area, Bacolod City','3rd Floor, SMX Lobby Area',NULL,'2nd Negros Speedcubing Open 2017',10672589,122944471),
('2RoundsofFMCinRzeszow2023','2 Rounds of FMC in Rzeszów 2023','Rzeszów','Poland','Zapraszamy na dwie rundy FMa w Rzeszowie!\r\n\r\nZwróć uwagę, że na tych zawodach NIE będą organizowane standardowe konkurencje takie jak 3x3.\r\n\r\nDruga runda odbędzie się jedynie jeżeli w konkurencji weźmie udział 8 zawodników.\r\n\r\nZawody odbędą się w Rzeszowie, w dzielnicy Wilkowyja, w pobliżu wypożyczalni sprzętu budowlanego RENTA.\r\nDokładny adres zawodów zostanie podany zarejestrowanym zawodnikom.\r\n\r\nWszystkie informacje na poszczególne tematy odnoszące się zawodów można znaleźć w odpowiednich zakładkach. W razie pytań należy kontaktować się z organizatorami.\r\n\r\n---------\r\n \r\nWe invite you to two rounds of FMC in Rzeszów!\r\n\r\nPlease note that standard events such as 3x3 will NOT be held at this event.\r\n\r\nSecond round will only take place if 8 competitors participate in an event.\r\n\r\nThe competition will take place in Rzeszów, in the Wilkowyja district, near the RENTA construction equipment rental.\r\nThe exact address of the competition will be given to registered competitors\r\n\r\nAll information on individual topics related to the competition can be found in the appropriate tabs. If you have any questions, please contact the organizers.',2023,11,10,11,10,0,'333fm','[{Przemysław Rogalski}{mailto:1686@worldcubeassociation.org}]','[{Kacper Paweł Dworak}{mailto:208487@worldcubeassociation.org}]','Private residence','Address will be provided to registered competitors after registration ends','Follow the signs',NULL,'2 Rounds of FMC in Rzeszów 2023',50038998,22053605),
('2x2at2inPrague2024','2x2 at 2 in Prague 2024','Praha','Czech Republic','# **Soutěž bude probíhat přes noc!!!**\nProsíme, zvažte dobře svou registraci.\n\n# **This competition will take place overnight!!!**\nMake sure to consider your registration thoroughly.\n',2024,8,31,9,1,0,'222 333 333oh 444 555 666 777 pyram sq1','[{Emma Beranová}{mailto:169302@worldcubeassociation.org}]','[{Veronika Becková}{mailto:19658@worldcubeassociation.org}]','[DDM Ulita](https://www.ulita.cz) ','Na Balkáně 2866/17a, 130 00 Praha 3','Velký sál, následujte šipky ',NULL,'2x2 at 2 in Prague 2024',50094509,14481820),
('2x2CubeMastersBogota2023','2x2 Cube Masters Bogotá 2023','Bogotá','Colombia','Organizadores/Organizers:\r\n\r\nJuan Camilo González Barragán\r\nSpeedcubing Colombia\r\n\r\nPatrocinadores/Sponsors:\r\n\r\nEdurubiks',2023,11,26,11,26,0,'222 333 333oh minx','[{Dennis Rosero}{mailto:5593@worldcubeassociation.org}] [{Manuel Popayán}{mailto:42265@worldcubeassociation.org}]','[{Juan Camilo González Barragán}{mailto:48502@worldcubeassociation.org}] [{Speedcubing Colombia}{mailto:324522@worldcubeassociation.org}]','Salón Comunal Villa del Río','Calle 55A sur # 66-50','Primer piso',NULL,'2x2 Cube Masters Bogotá 2023',4601995,-74157221),
('2x2inaMadisonLodge2022','2x2 in a Madison Lodge 2022','Madison, Wisconsin','USA','While 2x2 is the main event of this competition, 3x3 is still featured. We hope you\'ll join us in Madison this December!\r\n',2022,12,3,12,3,0,'222 333 555 pyram sq1','[{Carter Kucala}{mailto:31001@worldcubeassociation.org}] [{James Quinn}{mailto:10111@worldcubeassociation.org}]','[{Simon Kellum}{mailto:24542@worldcubeassociation.org}] [{Zeke Mackay}{mailto:19818@worldcubeassociation.org}]','Wisconsin Masonic Center','301 Wisconsin Ave, Madison, WI 53703','Grand Ballroom',NULL,'2x2 in a Madison Lodge 2022',43077407,-89386762),
('2x2inTamakiMakaurau2025','2x2 in Tāmaki Makaurau 2025','Auckland','New Zealand','2x2 in Tāmaki Makaurau 2025 is an official World Cube Association (WCA) sanctioned speedcubing competition.\n\nThis competition is open to all competitors regardless of age, experience, or skill. No prior experience in WCA competitions is necessary.\n\nPlease make sure to read all the information in the FAQ and other tabs before registering. All competitors should be familiar with the information in these tabs.\n\n![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6ODg3NTEsInB1ciI6ImJsb2JfaWQifX0=--80252e0cd66b2379b9189773f7aeef5814b04cfe/2x2tamaki_logo_02.png)\n\n![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBc0JPIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--09f328966024b349b182c10e5943a3983f83b9cd/snz_logo_v06.png)\n\n[Website](https://speedcubing.org.nz) | [Facebook](https://facebook.com/speedcubingnz) | [Instagram](https://instagram.com/speedcubingnz)',2025,8,16,8,16,0,'222 333 555 666 777 clock','[{Caleb Hall}{mailto:150463@worldcubeassociation.org}] [{Jack Maddigan}{mailto:186750@worldcubeassociation.org}] [{Nick Ng}{mailto:250946@worldcubeassociation.org}]','[{Ram Thakkar (राम ठक्कर)}{mailto:7839@worldcubeassociation.org}] [{Yuki Gao}{mailto:177546@worldcubeassociation.org}]','Freemans Bay Community Hall','52 Hepburn Street, Freemans Bay, Auckland 1011','Auditorium',NULL,'2x2 in Tāmaki Makaurau 2025',-36853159,174751147),
('30thAnniversaryMegaHouse2010','30th Anniversary MegaHouse Cup 2010','Tokyo','Japan','',2010,7,24,7,25,0,'222 333 333bf 333oh 444 555 magic','[{Yuji Suse (巣瀬雄史)}{mailto:313@worldcubeassociation.org}]','[{JRCA関西支部}{mailto:74960@worldcubeassociation.org}]','[National Olympics Memorial Youth Center](http://nyc.niye.go.jp/) (day 1) [Mediage Atrium](http://www.aquacity.jp/) (day 2)','3-1 Yoyogi Kamizono-cho, Shibuya-ku (day 1) 1-7-1 Daiba, Minato-ku (day 2)','','http://jrca.cc/modules/d3forum/index.php?topic_id=55#post_id436','MegaHouse Cup 2010',35689487,139691706),
('333OnlyHamiltonA2022','3x3x3 Only Hamilton A 2022','Hamilton, Ontario','Canada','This is a competition in a series with [Hamilton Side Events 2022](https://www.worldcubeassociation.org/competitions/HamiltonSideEvents2022) and [3x3x3 Only Hamilton B 2022](https://www.worldcubeassociation.org/competitions/333OnlyHamiltonB2022). You will only be able to register for **one** of these three competitions. Attempting to register for more than one of these competitions will result in only one of your registrations being accepted. \r\n\r\nThis competition is targeted towards new competitors, but you do not have to be a new competitor to register for this competition.',2022,5,29,5,29,0,'333','[{Abdullah Gulab}{mailto:6898@worldcubeassociation.org}] [{Jonathan Esparaz}{mailto:12958@worldcubeassociation.org}] [{Liam Orovec}{mailto:5952@worldcubeassociation.org}] [{Sarah Strong}{mailto:1352@worldcubeassociation.org}]','[{Abdullah Gulab}{mailto:6898@worldcubeassociation.org}] [{Fatima Gulab}{mailto:116519@worldcubeassociation.org}] [{Jonathan Esparaz}{mailto:12958@worldcubeassociation.org}] [{Liam Orovec}{mailto:5952@worldcubeassociation.org}] [{Sarah Strong}{mailto:1352@worldcubeassociation.org}]','McMaster University','1280 Main Street West, Hamilton','McMaster University Student Centre - CIBC Hall, 3rd Floor',NULL,'3x3x3 Only Hamilton A 2022',43262244,-79920286),
('333OnlyHamiltonB2022','3x3x3 Only Hamilton B 2022','Hamilton, Ontario','Canada','This is a competition in a series with [Hamilton Side Events 2022](https://www.worldcubeassociation.org/competitions/HamiltonSideEvents2022) and [3x3x3 Only Hamilton A 2022](https://www.worldcubeassociation.org/competitions/333OnlyHamiltonA2022). You will only be able to register for **one** of these three competitions. Attempting to register for more than one of these competitions will result in only one of your registrations being accepted. \r\n\r\nThis competition is targeted towards new competitors, but you do not have to be a new competitor to register for this competition.',2022,5,29,5,29,0,'333','[{Abdullah Gulab}{mailto:6898@worldcubeassociation.org}] [{Jonathan Esparaz}{mailto:12958@worldcubeassociation.org}] [{Liam Orovec}{mailto:5952@worldcubeassociation.org}] [{Sarah Strong}{mailto:1352@worldcubeassociation.org}]','[{Abdullah Gulab}{mailto:6898@worldcubeassociation.org}] [{Fatima Gulab}{mailto:116519@worldcubeassociation.org}] [{Jonathan Esparaz}{mailto:12958@worldcubeassociation.org}] [{Liam Orovec}{mailto:5952@worldcubeassociation.org}] [{Sarah Strong}{mailto:1352@worldcubeassociation.org}]','McMaster University','1280 Main Street West, Hamilton','McMaster University Student Centre - CIBC Hall, 3rd Floor',NULL,'3x3x3 Only Hamilton B 2022',43262244,-79920286),
('33TrentiniATrento2025','Trentatré Trentini Entrarono a Trento 2025','Povo, Trento','Italy','**Note: you will have to pay 10€ extra at the venue if you are not a Cubing Italy member.**\nMembership is free! More info in the [Registration tab](https://www.worldcubeassociation.org/competitions/33TrentiniATrento2025#51769-registration-registrazione-faq).\n\n---\n\n**Nota: dovrai pagare altri 10€ in loco se non sei un socio di Cubing Italy.**\nAssociarsi è gratis! Scopri come nella [Sezione Registrazione](https://www.worldcubeassociation.org/competitions/33TrentiniATrento2025#51769-registration-registrazione-faq).\n',2025,7,5,7,6,0,'333bf 333fm 333mbf 444bf 555 666 777 clock minx sq1','[{Fabian Tomasović}{mailto:184971@worldcubeassociation.org}] [{Mattia Pasquini}{mailto:135257@worldcubeassociation.org}]','[{Cubing Italy}{mailto:1278@worldcubeassociation.org}] [{Enrico Tenuti}{mailto:61837@worldcubeassociation.org}] [{Fabian Tomasović}{mailto:184971@worldcubeassociation.org}]','Sala Video Nichelatti','via Don T. Dallafior, 7','',NULL,'33 Trentini a Trento 2025',46064867,11153483),
('345CubeDayAllen2019','345 Cube Day Allen 2019','Allen, Texas','USA','***Please note that this schedule is subject to change, as we may hold events slightly earlier or later than shown depending on whether the competition is running ahead of schedule or behind schedule.***\r\n\r\nThis competition is recognized as an official World Cube Association competition. Therefore, ***all competitors should be familiar with the WCA regulations. If you are new to competing, you may want to look at CubingUSA\'s Competitor Tutorial.***',2019,10,13,10,13,0,'333 333bf 333mbf 444 444bf 555 555bf','[{Jae Park}{mailto:21148@worldcubeassociation.org}]','[{Andres Rodriguez}{mailto:6143@worldcubeassociation.org}] [{Azhar Virani}{mailto:9555@worldcubeassociation.org}] [{Jae Park}{mailto:21148@worldcubeassociation.org}] [{Jeff Park}{mailto:19911@worldcubeassociation.org}] [{Mahith Bandi}{mailto:22136@worldcubeassociation.org}] [{Vincent Chen}{mailto:89663@worldcubeassociation.org}]','[COURTYARD DALLAS ALLEN AT ALLEN EVENT CENTER](https://www.marriott.com/hotels/travel/dalan-courtyard-dallas-allen-at-the-john-q-hammons-center/)','210 E Stacy Rd, Allen, TX 75002','Cottonwood Ballrooms',NULL,'345 Cube Day Allen 2019',33128501,-96654290),
('360DegreesWellnessOpen2015','360 Degrees Wellness Open 2015','Antipolo, Rizal','Philippines','Registration fee is 200php for the first 3 events and additional 50php per extra event. Payment is needed for competitors coming from the Philippines before WCA registration will be approved. For more info, kindly check Pinoy Cubers facebook page or message the admins for details.',2015,8,9,8,9,0,'222 333 333bf 333oh 444 555 pyram','[{John Edison Ubaldo (ᜇ᜔ᜌᜓ︀ᜈ᜔ ᜁᜇᜒᜐᜓ︀ᜈ᜔ ᜂᜊᜎ᜔ᜇᜓ︀)}{mailto:349@worldcubeassociation.org}]','[{Lorenzo Bonoan}{mailto:1269@worldcubeassociation.org}]','[Blue Acacia Events Place](https://www.facebook.com/blueacaciaeventsplace?fref=ts)','I. Tapales Street, Antipolo, Rizal, Philippines','The competition will be held at the basement.','http://pinoycubersgroup.webs.com/360dwo-2015','360 DWO 2015',14580829,121177808),
('360DegreeWellnessOpen2014','360 Degree Wellness Open 2014','QUEZON','Philippines','Competition is limited only to 25 competitors. First come first join per discretion of the organizer.',2014,8,30,8,30,0,'222 333 333bf 333oh 444 555','[{Jonathan Papa}{mailto:1627@worldcubeassociation.org}]','[{Lorenzo Bonoan}{mailto:1269@worldcubeassociation.org}]','360 Degree Wellness Center','337 Katipunan Avenue, Loyola Heights','3rd Floor','http://pinoycubers.webs.com/360dwo2k14.htm','360 DWO 2014',14644234,121074237),
('3BLDonaMadisonMoNona2024','3BLD on a Madison MoNona 2024','Madison, Wisconsin','USA','Spectators are allowed, but please make sure to be quiet and curteous towards competitors. We would not recommend attending during any 3x3x3 Fewest Moves attempts (see Schedule tab).\n\nThis competition is supported by the [Midwest Cubing Assocation](https://www.midwestcubing.org/). \n![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBcEE5IiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--f0c6a086505e69b91939fee18713404cbb6553d5/image.png)',2024,2,17,2,18,0,'333bf 333fm 333mbf 444bf 555bf clock','[{Carter Kucala}{mailto:31001@worldcubeassociation.org}] [{Joshua Feran}{mailto:7944@worldcubeassociation.org}] [{Simon Kellum}{mailto:24542@worldcubeassociation.org}] [{Zeke Mackay}{mailto:19818@worldcubeassociation.org}]','[{Carter Kucala}{mailto:31001@worldcubeassociation.org}] [{Midwest Cubing Association}{mailto:310337@worldcubeassociation.org}] [{Simon Kellum}{mailto:24542@worldcubeassociation.org}] [{Zeke Mackay}{mailto:19818@worldcubeassociation.org}]','Monona Terrace','1 John Nolen Dr, Madison, WI 53703','Meeting Rooms M+N',NULL,'3BLD on a Madison MoNona 2024',43071556,-89380278),
('3eLordagskubeniVasteras2024','3:e Lördagskuben i Västerås 2024','Västerås','Sweden','Välkomna till 3:e Lördagskuben i Västerås 2024!\r\n\r\nAlla är varmt välkomna att delta, oavsett om du löser kuben på 5 sekunder eller 5 minuter samt oavsett tidigare tävlingserfarenhet.\r\n\r\nVi ber er läsa igenom alla flikar på denna sida eftersom de innehåller mycket värdefull information.\r\n\r\n--\r\n\r\nWelcome to 3:e Lördagskuben i Västerås 2024!\r\n\r\nEveryone is welcome to participate, regardless of whether you solve the cube in 5 seconds or 5 minutes and regardless of prior competition experience.\r\n\r\nWe ask you to read through all the tabs on this page as they contain very valuable information.\r\n\r\n[![](https://cuboss.se/wp-content/uploads/2024/01/cuboss-svekub-loggor.png)](https://svekub.se/om_oss/svekub-cuboss/)',2024,6,1,6,1,0,'222 333 333bf 333oh 444 444bf 555 555bf 666 777 clock minx pyram skewb sq1','[{Daniel Wallin}{mailto:567@worldcubeassociation.org}] [{Helmer Ewert}{mailto:13064@worldcubeassociation.org}] [{Peter Hugosson-Miller}{mailto:193382@worldcubeassociation.org}]','[{Anton Löfberg}{mailto:212140@worldcubeassociation.org}] [{SveKub}{mailto:236778@worldcubeassociation.org}]','Viksängsskolan','Viksängsgatan 23, 723 47 Västerås','Matsalen',NULL,'3:e Lördagskuben i Västerås 2024',59607616,16584644),
('3FMCRoundsinRzeszow2023','3 FMC Rounds in Rzeszów 2023','Rzeszów','Poland','Pierwsze ogłoszone zawody w Polsce z trzema rundami konkurencji FMC!\r\n\r\nZwróć uwagę, że na tych zawodach NIE będą organizowane standardowe konkurencje takie jak 3x3.\r\n\r\nWszystkie informacje na poszczególne tematy odnoszące się zawodów można znaleźć w odpowiednich zakładkach. \r\n\r\nW razie jakichkolwiek pytań, szczególnie tych dotyczących dojazdu do Rzeszowa i miejsca zawodów prosimy o kontakt z organizatorami.\r\n\r\n---\r\n\r\n\r\nThe first announced competition in Poland with three rounds of FMC!\r\n\r\nPlease note that standard events such as 3x3 will NOT be held at this event.\r\n\r\nAll information on individual topics related to the competition can be found in the appropriate tabs.\r\n\r\nIf you have any questions, especially those regarding access to Rzeszów and the venue of the competition, please contact the organizers.',2023,7,21,7,22,0,'333fm','[{Karol Zakrzewski}{mailto:15338@worldcubeassociation.org}]','[{Kacper Paweł Dworak}{mailto:208487@worldcubeassociation.org}]','[Rzeszowski Dom Kultury filia Budziwój](https://budziwoj.rdk.rzeszow.pl/)','Budziwojska 194, 35-317 Rzeszów','Up the stairs and on the right','https://www.facebook.com/events/739246644465154/?active_tab=discussion','3 FMC Rounds in Rzeszów 2023',49966759,21980017),
('3MolaOpen2010','3Mola Open 2010','Gdańsk','Poland','',2010,6,12,6,12,0,'222 333 333bf 333oh 444 555 magic pyram','[{Adam Joks}{mailto:1592@worldcubeassociation.org}]','[{Adam Polkowski}{mailto:293@worldcubeassociation.org}]','Pier-Brzezno','Pier-Brzezno 80-363 Gdansk','','http://www.kostkarubika.org/','3Mola Open 2010',54414116,18624948),
('3MolaOpen2011','3Mola Open 2011','Gdańsk','Poland','',2011,6,4,6,4,0,'222 333 333bf 333oh 444 555 magic mmagic pyram sq1','[{Adam Polkowski}{mailto:293@worldcubeassociation.org}]','[{Adam Polkowski}{mailto:293@worldcubeassociation.org}]','Pier-Brzezno','Pier-Brzezno 80-363 Gdansk','','http://www.kostkarubika.org/','3Mola Open 2011',54414116,18624948),
('3MoreFMCRoundsinRzeszow2023','3 More FMC Rounds in Rzeszów 2023','Rzeszów','Poland','Drugie ogłoszone zawody w Polsce z trzema rundami konkurencji FMC!\r\n\r\nZwróć uwagę, że na tych zawodach NIE będą organizowane standardowe konkurencje takie jak 3x3.\r\n\r\nWszystkie informacje na poszczególne tematy odnoszące się zawodów można znaleźć w odpowiednich zakładkach. \r\n\r\nW razie jakichkolwiek pytań, szczególnie tych dotyczących dojazdu do Rzeszowa i miejsca zawodów prosimy o kontakt z organizatorami.\r\n\r\n---\r\n\r\n\r\nSecond announced competition in Poland with three rounds of FMC!\r\n\r\nPlease note that standard events such as 3x3 will NOT be held at this event.\r\n\r\nAll information on individual topics related to the competition can be found in the appropriate tabs.\r\n\r\nIf you have any questions, especially those regarding access to Rzeszów and the venue of the competition, please contact the organizers.',2023,7,22,7,23,0,'333fm','[{Karol Zakrzewski}{mailto:15338@worldcubeassociation.org}]','[{Kacper Paweł Dworak}{mailto:208487@worldcubeassociation.org}]','[Rzeszowski Dom Kultury filia Staromieście](https://staromiescie.rdk.rzeszow.pl/)','Staromiejska 43a, 35-231 Rzeszów','Main hall on the ground floor','https://www.facebook.com/events/739246644465154/?active_tab=discussion','3 More FMC Rounds Rzeszów 2023',50059044,21999723),
('3rdCoastCubing2019','3rd Coast Cubing 2019','Holland, Michigan','USA','In Holland, we are surrounded by beautiful beaches on the coast of Lake Michigan. With the first WCA competition to take place in Holland, we hope that you will all set PBs by the beach.\r\n\r\nThere will be TWO rounds of Redi cube in this competition for the MoYu Redi Cube Cup. This is not an official WCA event, so these rounds do not appear in the Events tab, but they are listed on the schedule. The only requirement is that you know how to solve, and have a redi cube.',2019,7,20,7,20,0,'222 333 333bf 444 555 pyram sq1','[{James Hildreth}{mailto:319@worldcubeassociation.org}] [{Joshua Feran}{mailto:7944@worldcubeassociation.org}]','[{Ian Krueger}{mailto:38096@worldcubeassociation.org}] [{Joshua Elwood}{mailto:38101@worldcubeassociation.org}] [{Noah Bonnema}{mailto:127793@worldcubeassociation.org}]','Haworth Inn and Conference Center','225 College Avenue, Holland MI  49423','In the ballroom.',NULL,'3rd Coast Cubing 2019',42788971,-86103276),
('3rdGuwahatiOpen2017','3rd Guwahati Open 2017','Guwahati, Assam','India','Registrations will be open online till 7th June. There will be on spot registration but participants are advised to register online as spot registrations are limited (FCFS). The registration fee payment can be done at the venue. Please see the payments tab for detailed instructions.',2017,6,10,6,11,0,'222 333 333bf 333oh 444 555 minx pyram skewb','[{Hari Anirudh}{mailto:8111@worldcubeassociation.org}]','[{Kabyanil Talukdar}{mailto:17767@worldcubeassociation.org}]','Cotton College','Pan Bazar, Guwahati, Assam 781001','KBR Hall',NULL,'3rd Guwahati Open 2017',26187337,91746709),
('3RegularFortaleza2020','3-Regular Fortaleza 2020','Fortaleza, Ceará','Brazil','Feel free to write to us for more help in English.',2020,1,11,1,11,0,'222 333 333bf 333oh 444 minx skewb sq1','[{Rafael de Andrade Cinoto}{mailto:247@worldcubeassociation.org}]','[{Davi de Andrade Iácono}{mailto:14973@worldcubeassociation.org}] [{Francisco Thales Rocha Sousa}{mailto:33493@worldcubeassociation.org}]','Condomínio Júlio César','Travessa Júlio César, 110','Salão de Festas do Condomínio',NULL,'3-Regular Fortaleza 2020',-3755978,-38550338),
('3x3at3inPrague2025','3x3 at 3 in Prague 2025','Prague','Czech Republic','# **Soutěž bude probíhat přes noc!!!**\nProsíme, zvažte dobře svou registraci.\n\n# **This competition will take place overnight!!!**\nMake sure to consider your registration thoroughly.\n',2025,11,1,11,2,0,'222 333 444 555 666 777 clock','[{Emma Beranová}{mailto:169302@worldcubeassociation.org}] [{Jan Křížka}{mailto:92795@worldcubeassociation.org}] [{Tomáš Nguyen}{mailto:12783@worldcubeassociation.org}]','[{Natálie Rajdusová}{mailto:451233@worldcubeassociation.org}] [{Veronika Becková}{mailto:19658@worldcubeassociation.org}]','[DDM Ulita](https://www.ulita.cz) ','Na Balkáně 2866/17a, 130 00 Praha 3','Velký sál, následujte šipky ',NULL,'3x3 at 3 in Prague 2025',50094509,14481820),
('3x3inMadison2026','3x3 in Madison 2026','Madison, Wisconsin','USA','Welcome to the finale of our four-year long Madison events series and Wisconsin\'s first 3-day competition since 2019. Enjoy every official 3x3 event and more! If you\'re new to competing, this is a great competition to be your first. \n\nThis competition is supported by the Midwest Cubing Association.\n\n![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MTA0MzczLCJwdXIiOiJibG9iX2lkIn19--0b2bff7fdab6f00f6ece00325e15fc57dd4e5896/MCA-Final-Logo%20(Vector%20png).avif)',2026,5,8,5,10,0,'222 333 333bf 333fm 333mbf 333oh 666 777 clock minx skewb sq1','[{Carter Kucala}{mailto:31001@worldcubeassociation.org}] [{Joshua Feran}{mailto:7944@worldcubeassociation.org}] [{Simon Kellum}{mailto:24542@worldcubeassociation.org}] [{Zeke Mackay}{mailto:19818@worldcubeassociation.org}]','[{Carter Kucala}{mailto:31001@worldcubeassociation.org}] [{Midwest Cubing Association}{mailto:310337@worldcubeassociation.org}] [{Simon Kellum}{mailto:24542@worldcubeassociation.org}] [{Zeke Mackay}{mailto:19818@worldcubeassociation.org}]','Monona Terrace','1 John Nolen Dr, Madison, WI 53073','Madison Ballroom',NULL,'3x3 in Madison 2026',43071248,-89380468),
('3x3OnlyCalgary2019','3x3 Only Calgary 2019','Calgary, Alberta','Canada','',2019,3,9,3,9,0,'333 333bf 333fm 333ft 333mbf 333oh','[{Kristopher De Asis}{mailto:264@worldcubeassociation.org}]','[{Ryan Yasinko}{mailto:1068@worldcubeassociation.org}]','[Woodcreek Community Hall](http://www.woodcreekcommunity.ca/index.html)','1991 Woodview Dr, Calgary AB T2W 5E5','Main hall. Use the entrance on the west side of the building marked \"Entrance\". ',NULL,'3x3 Only Calgary 2019',50941042,-114104875),
('3x3OnlyMinnesota2019','3x3 Only Minnesota 2019','Plymouth, Minnesota','USA','**Please note that the main events start AFTER lunch.** Please indicate in your registration comments whether you would like the pizza for lunch or not so we can plan accordingly. ',2019,8,24,8,24,0,'333 333bf 333fm 333ft 333mbf 333oh','[{Walker Welch}{mailto:7184@worldcubeassociation.org}]','[{Carter Kucala}{mailto:31001@worldcubeassociation.org}]','Ramada Hotel & Conference Center ','2705 Annapolis Ln N, Plymouth, MN 55441','Sunset Room',NULL,'3x3 Only Minnesota 2019',45008782,-93455349),
('3x3sin303Colorado2025','3x3s in 303 Colorado 2025','Denver, Colorado','USA','### While this competition does have 3x3, this competition also features less common \"quiet\" events where silence is requested of all competitors and spectators. We do not recommend this competition for newer competitors, but all are welcome. \n\n### If you are interested in normal speedsolving events, please look into other competitions in this area, and stay tuned for future announcements\n\n3x3 is the main event of the competition. \n\n### *By signing up, you agree to contribute throughout the entirety of the competition due to the small size*. ',2025,12,6,12,6,0,'333 333bf 333fm 333mbf 333oh','[{Abhimanyu Singhal (अभिमन्यु सिंघल)}{mailto:1111@worldcubeassociation.org}] [{Luke Meszar}{mailto:217489@worldcubeassociation.org}] [{TJ Kelly}{mailto:73072@worldcubeassociation.org}]','[{Jason Hammerman}{mailto:131529@worldcubeassociation.org}]','The King Center, Auraria Campus','855 Lawrence Way, Denver, CO 80204','In Room 206',NULL,'3x3s in 303 Colorado 2025',39743696,-105006122),
('3x3x3CubeFrisco2019','3x3x3 Cube Frisco 2019','Frisco, Texas','USA','***Please note that this schedule is subject to change, as we may hold events slightly earlier or later than shown depending on whether the competition is running ahead of schedule or behind schedule.***\r\n\r\nThis competition is recognized as an official World Cube Association competition. Therefore, ***all competitors should be familiar with the WCA regulations. If you are new to competing, you may want to look at CubingUSA\'s Competitor Tutorial.***',2019,3,9,3,9,0,'333 333bf 333fm 333ft 333mbf 333oh','[{Jae Park}{mailto:21148@worldcubeassociation.org}]','[{Andres Rodriguez}{mailto:6143@worldcubeassociation.org}] [{Jae Park}{mailto:21148@worldcubeassociation.org}] [{Jeff Park}{mailto:19911@worldcubeassociation.org}]','[Hilton Garden Inn Frisco](https://hiltongardeninn3.hilton.com/en/hotels/texas/hilton-garden-inn-frisco-DFWFRGI/index.html)','7550 Gaylord Parkway, Frisco, Texas, 75034, USA','Frisco Bridges Ballroom',NULL,'3x3x3 Cube Frisco 2019',33102185,-96819106),
('3x3x3HanMaDang2017','3x3x3 HanMaDang 2017','서울특별시 (Seoul)','Korea','참가 정원: 130명\r\n참가 접수 기간: 1월 14일 오전 10시 ~ 2월 11일 오후 7시. \r\n참가비: 첫 종목 5천원, 추가 종목당 3천원. \r\n입금 계좌: IBK 은행 299-079830-02-011 (유병선)\r\n* 현장 접수는 받지 않습니다. \r\n* ***입금 이후 환불은 가능하지 않습니다.*** 단, 참가자 명단에 들지 못한 경우에는 전액 환불해 드립니다. \r\n* 참가 신청 + 참가비 입금 = 참가 접수 완료\r\n\r\n-------- \r\nCompetitor limit: 130 people\r\nRegistration period: Jan. 14. 10AM to Feb. 11. 7PM.\r\nRegistration fee: 5000 WON for first event, 3000 WON for each additional event. \r\n* Please transfer money to this account: IBK Bank 299-079830-02-011 (유병선)\r\n* No registration will be allowed at the venue. \r\n* ***No refunds***, except if you transferred money and did not make the competitor list. \r\n* Registration on this website + money transfer = completion of regitration ',2017,2,18,2,18,0,'333 333bf 333fm 333ft 333mbf 333oh','[{Ilkyoo Choi (최일규)}{mailto:14@worldcubeassociation.org}]','[{Korea Cube Culture United (한국큐브문화진흥회)}{mailto:5397@worldcubeassociation.org}]','[도봉구민회관 (DoBong-Gu Hall)](http://www.dobongsiseol.or.kr/index_hall.html)','서울특별시 도봉구 도봉로 552 (552 Dobong-Roh, Dobong-gu)','2층, 회의실 (second floor, conference room)',NULL,'HanMaDang 2017',37654108,127038406),
('3x3x3paaBiblioteket2022','Tre Gange Tre Gange Tre på Biblioteket 2022','København','Denmark','OBS: Standard 3x3x3 disciplinen afholdes ikke. Du kan se de kommende konkurrencer i Danmark [her](https://www.worldcubeassociation.org/competitions?region=Denmark).\r\n\r\n---\r\nNotice: The standard 3x3x3 event will not be held. You can see the other upcoming competitions in Denmark [here](https://www.worldcubeassociation.org/competitions?region=Denmark).',2022,12,17,12,17,0,'333bf 333fm','[{Callum James Goodyear-Jørgensen}{mailto:695@worldcubeassociation.org}] [{Daniel Vædele Egdal}{mailto:6777@worldcubeassociation.org}] [{Malte Oliver Bøgh Kjøller}{mailto:97133@worldcubeassociation.org}]','[{Asbjørn Brummer Birkelund}{mailto:147126@worldcubeassociation.org}] [{Daniel Vædele Egdal}{mailto:6777@worldcubeassociation.org}] [{Dansk Speedcubing Forening}{mailto:95131@worldcubeassociation.org}] [{Ida Exner}{mailto:71804@worldcubeassociation.org}]','Datalogisk institut, Københavns Universitet','Universitetsparken 1, 2100 København','Øvelseslokale 4-0-17 (biblioteket)',NULL,'3x3x3 på Biblioteket 2022',55702095,12561067),
('40thAnniversaryPeru2014','40th Anniversary Peru 2014','Arequipa','Peru','',2014,11,8,11,8,0,'222 333 333bf 333oh 444 pyram','[{Natán Riggenbach}{mailto:79@worldcubeassociation.org}]',NULL,'Parque Lambramani','Av. Lambramani 325','Patio Central','http://www.cubingsouthamerica.com/Established1974/index.php','40th Anniversary 2014',-16410336,-71519907),
('444Puebla2025','444 Puebla 2025','Puebla','Mexico','![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6NzkwNjQsInB1ciI6ImJsb2JfaWQifX0=--fe61a13a7ab36b3978b637f061183977d12ee13d/444_Logo_500.jpg)\n\n##### Español\n-------------------------------------------------------------------------------------------------------------------------------------\n¡Bienvenidos a **444 Puebla 2025**!\n\nPuebla, la Ciudad de los Ángeles, y Wars Cube están listos para recibirte en esta emocionante competencia. Ven y celebra con nosotros el 4.º aniversario de Wars Cube en su 4.º torneo organizado para el Día del Niño, en el 4.º mes del año. Y, por supuesto, ya sabes cuál será nuestra categoría principal.\n\n**¿Aceptas el reto?**\n\nEsta competencia es posible gracias al apoyo del **[Instituto Municipal del Deporte de Puebla](https://imd.pueblacapital.gob.mx/)**.\n\n444 Puebla 2025 es una competencia oficial de la WCA, por lo que todos los competidores deben estar familiarizados con el [Reglamento](https://www.worldcubeassociation.org/regulations/translations/spanish-american/).\n\n​\n##### English\n-------------------------------------------------------------------------------------------------------------------------------------\n\nWelcome to **444 Puebla 2025**!\n\nPuebla, the City of Angels, and Wars Cube are ready to welcome you to this exciting competition. Come and celebrate with us the 4th anniversary of Wars Cube at its 4th tournament organized for Children\'s Day, in the 4th month of the year. And, of course, you already know what our main category will be.\n\n**Do you accept the challenge?**\n\nThis competition is made possible thanks to the support of the **[Instituto Municipal del Deporte de Puebla](https://imd.pueblacapital.gob.mx/)**.\n\n444 Puebla 2025 is an official WCA competition, so all competitors must be familiar with the [Regulations](https://www.worldcubeassociation.org/regulations).',2025,4,26,4,27,0,'222 333 333bf 333oh 444 555 clock pyram sq1','[{Adrián Ramírez}{mailto:327@worldcubeassociation.org}] [{Areli Rubí Gordillo Martínez}{mailto:328@worldcubeassociation.org}]','[{Christian Angeles Cardoso}{mailto:442598@worldcubeassociation.org}] [{Shalem Birzavit Meneses Pérez}{mailto:91858@worldcubeassociation.org}] [{Tania Díaz Ojeda}{mailto:475768@worldcubeassociation.org}] [{Zaira Michelle Pilón Rodriguez}{mailto:375187@worldcubeassociation.org}]','Polideportivo Xonaca ','CALLE 44 NORTE S/N COLONIA CRISTOBAL COLON, FRENTE A LA PLAZA EL CAMPANARIO, Centro Recreativo Polideportivo Morelos, 72330 Heroica Puebla de Zaragoza, Pue.','Canchas de Básquet',NULL,'444 Puebla 2025',19049593,-98165921),
('4BLDinaMadisonHall2023','4BLD in a Madison Hall 2023','Madison, Wisconsin','USA','Competitors are allowed at most one guest, and no guests may attend unattached to competitors.\r\n\r\nThis competition may be cancelled or other COVID restrictions may be added later if the COVID situation locally or nationally changes.',2023,1,28,1,29,0,'333bf 333fm 333mbf 444bf 555bf clock','[{Carter Kucala}{mailto:31001@worldcubeassociation.org}] [{Joshua Feran}{mailto:7944@worldcubeassociation.org}] [{Zeke Mackay}{mailto:19818@worldcubeassociation.org}]','[{Carter Kucala}{mailto:31001@worldcubeassociation.org}] [{Joshua Feran}{mailto:7944@worldcubeassociation.org}] [{Midwest Cubing Association}{mailto:310337@worldcubeassociation.org}]','Monona Terrace','1 John Nolen Dr, Madison, WI 53703','Hall of Ideas Room J',NULL,'4BLD in a Madison Hall 2023',43071248,-89380468),
('4BLDMadnessinDobrejovice2025','4BLD Madness in Dobřejovice 2025','Dobřejovice','Czech Republic',NULL,2025,10,18,10,18,0,'333bf 444bf 555bf 777 clock','[{Jan Fonš}{mailto:29909@worldcubeassociation.org}] [{Jan Křížka}{mailto:92795@worldcubeassociation.org}]','[{Jan Křížka}{mailto:92795@worldcubeassociation.org}] [{Natálie Rajdusová}{mailto:451233@worldcubeassociation.org}]','[Společenské centrum Dobřejovice](https://www.dobrejovice.cz/zivot-v-obci/sportovni-a-spolecenske-centrum/)','Čestlická 245, Dobřejovice','2nd floor',NULL,'4BLD Madness in Dobřejovice 2025',49983233,14580686),
('4thGuwahatiOpen2018','4th Guwahati Open 2018','Guwahati, Assam','India','There is on-spot registration.\r\nPlease bring your ID cards for identification at the venue.\r\n\r\nWe have a competitor limit of 130 participants which will be filled on First come basis.\r\n\r\nRegistration closes either on 28 August 2018, 23:59. IST or when registration count reaches 130 (whichever comes first)',2018,9,1,9,2,0,'222 333 333bf 333oh 444 555 minx pyram skewb','[{Sachin Arvind}{mailto:96587@worldcubeassociation.org}]','[{Kabyanil Talukdar}{mailto:17767@worldcubeassociation.org}]','Cotton University','Pan Bazar, Guwahati, Assam 781001','Sudmersen Hall, physics department, Cotton University. The hall is opposite of BSNL head office, Panbazar.',NULL,'4th Guwahati Open 2018',26187422,91746736),
('4x4byFourMadisonLakes2024','4x4 by Four Madison Lakes 2024','Madison, Wisconsin','USA','New to competing? This competition is a good one to be your first!\n\nThis competition is supported by the [**Midwest Cubing Association**](https://midwestcubing.org).\n![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBZ0dEIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--a6239c56608b03fda2194e41dd545ce91819975d/MCA-Final-Logo%20(WCA%20website%20version).png)\n',2024,12,7,12,7,0,'222 333 333oh 444 555','[{Carter Kucala}{mailto:31001@worldcubeassociation.org}] [{Joshua Feran}{mailto:7944@worldcubeassociation.org}] [{Simon Kellum}{mailto:24542@worldcubeassociation.org}] [{Zeke Mackay}{mailto:19818@worldcubeassociation.org}]','[{Carter Kucala}{mailto:31001@worldcubeassociation.org}] [{Midwest Cubing Association}{mailto:310337@worldcubeassociation.org}] [{Simon Kellum}{mailto:24542@worldcubeassociation.org}] [{Zeke Mackay}{mailto:19818@worldcubeassociation.org}]','Monona Terrace','1 John Nolen Dr, Madison, WI 53703','Hall of Ideas',NULL,'4x4 by Four Madison Lakes 2024',43071556,-89380278),
('4x4byRoad44Israel2024','4x4 by Road 44 Israel 2024','Be\'er Ya\'akov','Israel','![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MzU5MzAsInB1ciI6ImJsb2JfaWQifX0=--cd19b7777184c70e38df29593ca98b3bb91e3b24/Screenshot%202024-08-24%20at%2018.35.03.png)\n\n# 4x4 by Road 44! This competition doesn\'t have the regular 3x3 event.\n# \n# 4 על 4 על כביש 44! בתחרות הזאת אין את מקצה ה3*3 הרגיל.\n# ![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBb2xRIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--57773d0aebc46f3126ef9204d93b4d0c1b819e9d/1684768488121.png)\n# [Follow us on Instagram!](https://www.instagram.com/speedcubing_il_official/)',2024,9,27,9,27,0,'444 555 666 777','[{Amit Sheffer}{mailto:1802@worldcubeassociation.org}] [{Amitai Ziv}{mailto:261445@worldcubeassociation.org}] [{Shmulik Kachuriner}{mailto:68200@worldcubeassociation.org}]','[{Amitai Ziv}{mailto:261445@worldcubeassociation.org}] [{Yoel Khanin}{mailto:298161@worldcubeassociation.org}]','Atid youth village','Yosef Siton 1, Be\'er Ya\'akov Israel','Classrooms in the school',NULL,'4x4 by Road 44 Israel 2024',31941820,34824771),
('50andCountingIreland2024','50 and Counting Ireland 2024','Wexford','Ireland','[![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBcWhwIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--debd5acc00d4873d12ad382f60693888bb058e0b/comp.png)](https://www.utwistcubes.com/)\n\n# **Ireland\'s 50th Competition!**\n\nhttps://speedcubingireland.com/\nAdd us on [Facebook](https://www.facebook.com/speedcubingireland/) and [Instagram](https://www.instagram.com/speedcubingireland/?hl=en)! Join our [Discord Server](https://discord.gg/yuKTC3Hn8W)!\n\n',2024,4,27,4,28,0,'222 333 333bf 333oh 444 444bf 555bf 666 777 clock minx pyram skewb sq1','[{Kevin Timmons}{mailto:167434@worldcubeassociation.org}] [{Maria Beausang}{mailto:19883@worldcubeassociation.org}] [{Mary Hennessy}{mailto:19877@worldcubeassociation.org}] [{Simon Kelly}{mailto:54140@worldcubeassociation.org}]','[{Rían Burke}{mailto:164617@worldcubeassociation.org}] [{Speedcubing Ireland}{mailto:299813@worldcubeassociation.org}]','St. Josephs Community Centre Wexford','Newline Rd, Whiterock North, Wexford, Y35 A66C','Main Hall on the ground floor',NULL,'50 and Counting Ireland 2024',52328492,-6473440),
('50AnosCubeandoAvesMaria2024','50 Años Cubeando Aves María 2024','Sabaneta, Antioquia','Colombia','Organizadores/organizers:\nMauricio De Jesús Hernandez Grisalez: contacto al celular 3006000058\nAlejandro Restrepo Echeverri: 3332261556\nAndrés Felipe Rodríguez Londoño: 3137760573\nAves María Parque Comercial: 4035370 ext.: 300 o 3104532609\n\nPatrocinadores:\nAves Maria parque comercial. Sabaneta – Antioquia.\n\nSponsors:\nAves María Mall. Sabaneta - Antioquia.',2024,5,18,5,19,0,'222 333 333bf 333oh 444 clock pyram skewb','[{Alejandro Restrepo Echeverri}{mailto:50624@worldcubeassociation.org}] [{Andres Felipe Rodríguez Londoño}{mailto:155647@worldcubeassociation.org}]','[{Alejandro Restrepo Echeverri}{mailto:50624@worldcubeassociation.org}] [{Andres Felipe Rodríguez Londoño}{mailto:155647@worldcubeassociation.org}] [{Carlos Miguel Pérez}{mailto:256485@worldcubeassociation.org}] [{Mauricio de Jesus Hernandez Grizalez}{mailto:81564@worldcubeassociation.org}] [{Speedcubing Colombia}{mailto:324522@worldcubeassociation.org}]','Aves María Parque Comercial ','Calle 75 sur #43a - 202','Tercer piso, plaza Bistró, zona de comidas.',NULL,'50 Años Cubeando Aves María 2024',6148992,-75617354),
('50thAnniversaryinElverum2024','50th Anniversary in Elverum 2024','Elverum','Norway','This competition is open to everyone who wants to participate.',2024,5,18,5,19,0,'222 333 333bf 444 555 clock minx pyram skewb','[{Lars Johan Folde}{mailto:118737@worldcubeassociation.org}] [{Ulrik Bredland}{mailto:9241@worldcubeassociation.org}]','[{Anders Barhaugen}{mailto:9214@worldcubeassociation.org}]','Ungdommens Hus','St. Olavs Gate 6, 2414 Elverum','We will use the main room',NULL,'50th Anniversary in Elverum 2024',60881594,11564437),
('50thAnniversaryinIndo2024','50th Anniversary in Indonesia 2024','Jakarta','Indonesia','This competition is held in collaboration with Rapid Academy and the Embassy of Hungary in Indonesia to celebrate the 50th anniversary of one of the Hungarian inventions, Rubik\'s Cube.\n\nThere will be a cash prize for this competition from our sponsors, and also a special prize from Rubik’s (Toyspedia): Rubik’s 50th Anniversary Special Edition!\n\nThis competition is free for all Rapid Academy students.\n____\n\nPerlombaan ini diadakan bersama dengan Rapid Academy dan Kedutaan Besar Hongaria di Indonesia untuk merayakan 50 tahun salah satu ciptaan Hongaria, Rubik\'s Cube.\n\nAkan ada hadiah berupa uang tunai untuk kompetisi ini dari para sponsor, serta hadiah spesial dari Rubik\'s (Toyspedia): Rubik\'s 50th Anniversary Special Edition!\n\nKompetisi ini gratis untuk seluruh murid Rapid Academy.',2024,12,7,12,7,0,'222 333 333bf 444 pyram skewb','[{Cendy Cahyo Rahmat}{mailto:347@worldcubeassociation.org}] [{Hafizh Dary Faridhan Hudoyo}{mailto:1285@worldcubeassociation.org}] [{Wilson Alvis (陈智胜)}{mailto:1583@worldcubeassociation.org}]','[{Cendy Cahyo Rahmat}{mailto:347@worldcubeassociation.org}] [{Danang Adianto}{mailto:1693@worldcubeassociation.org}] [{Kenneth Nursalim}{mailto:154676@worldcubeassociation.org}] [{Winda Wardani}{mailto:93983@worldcubeassociation.org}]','Taman Ismail Marzuki','Jl. Cikini Raya No.8, Cikini, Menteng, Central Jakarta City, Jakarta 10330','Galeri Cipta 2 (3rd Floor)',NULL,'50th Anniversary in Indo 2024',-6190357,106838534),
('50YearsofCubingBulgaria2024','50 Years of Cubing Bulgaria 2024','Sofia','Bulgaria','Допустими са максимум 1 гост с всеки състезател. Таксата за зрители и гости се заплаща в деня на състезанието и е в размер на 5 лв/ден. Таксата за участие се заплаща в деня на състезанието, на специално обособена за целта маса. Можете да избирате в кой от дните ще се състезавате или и в двата.\nАдресът на Техно меджик ленд е: 1784 гр. София, бул. Цариградско шосе 111Б, сграда \"Експериментариум\" - София Тех Парк\n\n----------\n\nMaximum 1 guest per competitor. The fee for Guests and Spectators to be paid in the venue on the day of the competition and is 5lv/day. Registration fee to be paid in the venue on the day of the competition. You can choose on which day of the competition you will participate or both.\nThe address of Techno Magic Land is: 111B Tsarigradsko shose, \"Experimentarium\" hall - Sofia Tech Park.',2024,5,11,5,12,0,'222 333 333bf 333oh 444 555 clock','[{Borislav Marchovski}{mailto:76095@worldcubeassociation.org}] [{Plamen Mahladzhanov}{mailto:79477@worldcubeassociation.org}] [{Todor Enikov}{mailto:27063@worldcubeassociation.org}]','[{Borislav Marchovski}{mailto:76095@worldcubeassociation.org}] [{Plamen Mahladzhanov}{mailto:79477@worldcubeassociation.org}] [{Todor Enikov}{mailto:27063@worldcubeassociation.org}]','Experimentarium hall of Sofia Tech Park','Sofia, 111B Tsarigradsko shose, \"Experimentarium\" hall - Sofia Tech Park','Just follow the signs. The entry to the hall is directly after the bridge above Tsarigradsko shose blv.',NULL,'50 Years of Cubing Bulgaria 2024',42665807,23373769),
('50YearsPhilippines2024','50 Years of Cubing in the Philippines 2024','Quezon City','Philippines','![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MzYzMTYsInB1ciI6ImJsb2JfaWQifX0=--1dbf5d5aaa950049d863c0ff6eb00b8df195d781/50%20years%20of%20cubing%20in%20PH%20banner.png)',2024,10,6,10,6,0,'222 333 333bf 333oh clock minx skewb sq1','[{Bea Alexandra Marie Flores}{mailto:49744@worldcubeassociation.org}] [{Bille Janssen Lagarde}{mailto:676@worldcubeassociation.org}] [{Louie Jay Quibote}{mailto:6465@worldcubeassociation.org}] [{Yuji Yoshida}{mailto:9751@worldcubeassociation.org}]','[{Enika Aubrey Maninang}{mailto:48559@worldcubeassociation.org}] [{Jeremy Coan A. Peñaflor}{mailto:402070@worldcubeassociation.org}]','Robinsons Novaliches','P3P4+GJ Quezon City, Metro Manila','First Floor Trade Hall',NULL,'50 Years Philippines 2024',14735750,121056109),
('50YearsVallentuna2024','50 Years of Cubing - Vallentuna 2024','Vallentuna','Sweden','Välkomna till 50 Years of Cubing - Vallentuna 2024!\n\nAlla är varmt välkomna att delta, oavsett om du löser kuben på 5 sekunder eller 5 minuter samt oavsett tidigare tävlingserfarenhet. \n\nVi ber er läsa igenom alla flikar på denna sida eftersom de innehåller mycket värdefull information.\n\n-----\n\nWelcome to 50 Years of Cubing - Vallentuna 2024!\n\nEveryone is welcome to participate, regardless of whether you solve the cube in 5 seconds or 5 minutes and regardless of prior competition experience.\n\nWe ask you to read through all the tabs on this page as they contain very valuable information.\n\n[![](https://cuboss.se/wp-content/uploads/2024/01/cuboss-svekub-loggor.png)](https://svekub.se/om_oss/svekub-cuboss/)',2024,5,19,5,19,0,'222 333 333bf 333mbf 333oh 444 clock pyram skewb','[{Daniel Wallin}{mailto:567@worldcubeassociation.org}] [{Helmer Ewert}{mailto:13064@worldcubeassociation.org}] [{Peter Hugosson-Miller}{mailto:193382@worldcubeassociation.org}]','[{Peter Hugosson-Miller}{mailto:193382@worldcubeassociation.org}] [{SveKub}{mailto:236778@worldcubeassociation.org}]','Rosendalsskolan Norra','Ekebyvägen 2, 186 34 Vallentuna','The cafeteria in the school',NULL,'50 Years Vallentuna 2024',59541747,18069553),
('5BLDinaMadisonFall2024','5BLD in a Madison Fall 2024','Madison, Wisconsin','USA','This competition is not recommended for first time competitors. Please check out [4x4 by Four Madison Lakes 2024](https://www.worldcubeassociation.org/competitions/4x4byFourMadisonLakes2024), which will be more friendly towards beginners.\n\n5x5 Blindfolded is the main event of this competition. We recommend [giving it a try](https://www.worldcubeassociation.org/competitions/5BLDinaMadisonFall2024#47832-3-rounds-of-5bld)!\n\nThis competition is supported by the [Midwest Cubing Assocation](https://www.midwestcubing.org/). \n![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBcEE5IiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--f0c6a086505e69b91939fee18713404cbb6553d5/image.png)',2024,11,2,11,3,0,'333bf 333fm 333mbf 444bf 555bf 777 minx','[{Carter Kucala}{mailto:31001@worldcubeassociation.org}] [{Joshua Feran}{mailto:7944@worldcubeassociation.org}] [{Simon Kellum}{mailto:24542@worldcubeassociation.org}] [{Zeke Mackay}{mailto:19818@worldcubeassociation.org}]','[{Carter Kucala}{mailto:31001@worldcubeassociation.org}] [{Midwest Cubing Association}{mailto:310337@worldcubeassociation.org}] [{Simon Kellum}{mailto:24542@worldcubeassociation.org}] [{Zeke Mackay}{mailto:19818@worldcubeassociation.org}]','Monona Terrace','1 John Nolen Dr, Madison, WI 53703','Hall of Ideas J',NULL,'5BLD in a Madison Fall 2024',43071556,-89380278),
('5BldinTashkentPhaseOne2025','Five Blind in Tashkent Phase One - Denial - 2025','Tashkent','Uzbekistan','**English**\n\nThis is the Stage 1 of the series.\n\nThe competitor limit for this competition is 10 participants.\n\nForeign competitors are kindly requested to contact the delegate by email before purchasing tickets to travel to Uzbekistan. After your registration is confirmed, you will be asked to provide the copy of your ticket in order to make sure that you will participate in the competition.\n\n**Russian**\n\nЭто первая стадия серии.\n\nЛимит на количество участников - 10 человек.\n\nПросьба к участникам из других стран - перед приобретением билетов для поездки в Узбекистан свяжитесь с делегатом. После подтверждения вашей регистрации мы попросим вас предоставить копию вашего билета, чтобы быть уверенными, что вы примете участие в соревнованиях.',2025,11,29,11,29,0,'555bf','[{Igor Aipkin}{mailto:75134@worldcubeassociation.org}]','[{Igor Aipkin}{mailto:75134@worldcubeassociation.org}]','Apartment','Tashkent city, Furqat str., 167','',NULL,'5Bld in Tashkent Phase One 2025',41304078,69247783),
('5BLDMadnessSeongnam2024','5BLD Madness Seongnam 2024','성남 (Seongnam)','Korea','요청시, 모든 참가자가 스태프로 활동해 주셔야 합니다. \n\n	 \nAll participants are expected to staff the competition, upon the request.\nPlease refer to registration tab for registration fee information.\n',2024,11,9,11,9,0,'555bf','[{Jae Park}{mailto:21148@worldcubeassociation.org}]','[{Choi Goho (최고호)}{mailto:8330@worldcubeassociation.org}] [{Hyeok Yang (양혁)}{mailto:61395@worldcubeassociation.org}] [{Hyunjo Kim (김현조)}{mailto:41422@worldcubeassociation.org}] [{Jae Park}{mailto:21148@worldcubeassociation.org}]','인피니티타워 E동','경기도 성남시 수정구 금토로80번길 37 인피니티타워 E동','2층 (2nd floor)',NULL,'5BLD Madness Seongnam 2024',37407786,127078574),
('5BLDMadnessSeoul2024','5BLD Madness Seoul 2024','서울특별시 (Seoul)','Korea','요청시, 모든 참가자가 스태프로 활동해 주셔야 합니다. \n\n	 \nAll participants are expected to staff the competition, upon the request.\nPlease refer to registration tab for registration fee information.',2024,11,9,11,9,0,'555bf','[{Jae Park}{mailto:21148@worldcubeassociation.org}]','[{Choi Goho (최고호)}{mailto:8330@worldcubeassociation.org}] [{Hyeok Yang (양혁)}{mailto:61395@worldcubeassociation.org}] [{Hyunjo Kim (김현조)}{mailto:41422@worldcubeassociation.org}] [{Jae Park}{mailto:21148@worldcubeassociation.org}]','아벨수학학원 (Abel Math Institute)','서울특별시 관악구 남부순환로 1915 신한빌딩 (ShinHan Building, 1915 Nambusunhwan-ro, Bongcheon-dong, Gwanak-gu, Seoul)','4층 (4th floor)',NULL,'5BLD Madness Seoul 2024',37477862,126962191),
('5BLDMadnessSuwon2024','5BLD Madness Suwon 2024','수원','Korea','요청시, 모든 참가자가 스태프로 활동해 주셔야 합니다. \n\n	 \nAll participants are expected to staff the competition, upon the request.\nPlease refer to registration tab for registration fee information.',2024,11,9,11,9,0,'555bf','[{Jae Park}{mailto:21148@worldcubeassociation.org}]','[{Choi Goho (최고호)}{mailto:8330@worldcubeassociation.org}] [{Hyeok Yang (양혁)}{mailto:61395@worldcubeassociation.org}] [{Hyunjo Kim (김현조)}{mailto:41422@worldcubeassociation.org}] [{Jae Park}{mailto:21148@worldcubeassociation.org}]','Private Residence','수원시 영통구 광교 호수공원','Private Residence',NULL,'5BLD Madness Suwon 2024',37283091,127065921),
('5BLDMastersOpole2025','5BLD Masters Opole 2025','Opole','Poland','![](https://i.imgur.com/y4aZ08M.png) **Polski:** Serdecznie zapraszamy do Opola na prawdziwy spektakl mistrzów 5BLD!\n\n\n-----------------------\n![](https://i.imgur.com/i1ldA95.png) **English:** Come to Opole and see the real 5BLD Masters!\n\n![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6NjA5MDMsInB1ciI6ImJsb2JfaWQifX0=--114ff2b38ee1e3f8aae57d5390722155ddacee86/5bldmasterslogo.png)\n',2025,3,1,3,2,0,'333bf 333fm 333mbf 444bf 555 555bf minx sq1','[{Karol Zakrzewski}{mailto:15338@worldcubeassociation.org}] [{Patryk Milewczyk}{mailto:17351@worldcubeassociation.org}]','[{Adam Brzana}{mailto:259153@worldcubeassociation.org}] [{Karol Zakrzewski}{mailto:15338@worldcubeassociation.org}] [{Szymon Brzana}{mailto:102430@worldcubeassociation.org}]','Wojewódzki Inspektorat Weterynarii','Wrocławska 170, 46-020 Opole','Assembly hall',NULL,'5BLD Masters Opole 2025',50682163,17869058),
('5thGuwahatiOpen2019','5th Guwahati Open 2019','Guwahati, Assam','India','All the participants are requested to volunteer in the competition and every participant (except New comers) will be assigned to a particular event they have to Judge (or) Scramble in which they are participating, all this will be decided by the organising team.we will make sure that your volunteering will not affect your events.\r\nAdditional information will be provided in the tabs.\r\nPlease bring your ID cards for identification at the venue.\r\n\r\n\r\n',2019,12,28,12,29,0,'222 333 333bf 333oh 444 555 666 clock minx pyram skewb sq1','[{Akula Pavan Kumar}{mailto:5448@worldcubeassociation.org}]','[{Kabyanil Talukdar}{mailto:17767@worldcubeassociation.org}]','Cotton University','Pan Bazar, Guwahati, Assam 781001','Philosophy department ground floor ',NULL,'5th Guwahati Open 2019',26187422,91746736),
('5VallesMexicali2025','5 Valles Mexicali 2025','Mexicali','Mexico','![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6NjA5OTAsInB1ciI6ImJsb2JfaWQifX0=--15a0dab46a6839339cdb2329f0955bd4ae3a43e7/Frame%2013%20(7).png)\n\n¡Bienvenidos a la 5ta y primera competencia gratuita de la ciudad que capturo el sol! Mexicali los espera con los brazos abiertos\n\n> Esta competencia es reconocida como una competencia de la Asociación Mundial del Cubo. Por lo tanto, todos los competidores deben estar familiarizados y entender el  [Reglamento de la WCA](https://www.worldcubeassociation.org/regulations/translations/spanish-american/?fbclid=IwAR3v_4cpWpOtC4_igrrqwdUh75mfzGlcc6Pt0_TKKYWUHhNb5ZgUNmXwDi8)\n\n> This competition is recognized as an official World Cube Association competition. Therefore, all competitors must be familiar with the [WCA regulations](https://www.worldcubeassociation.org/regulations/?fbclid=IwAR0n-mCUBxgXOy6yes_qfkcwAewPCqqVV2E-3cyL2dFBydThzLxWXE2DNGs)',2025,2,22,2,22,0,'333 333oh clock pyram skewb','[{Christofer Alejandro Aguirre Robledo}{mailto:281690@worldcubeassociation.org}]','[{Alexandra Beltrán Guillén}{mailto:373185@worldcubeassociation.org}] [{Asociación Mexicana de Speedcubing}{mailto:434264@worldcubeassociation.org}] [{Cesar Gustavo Ceceña Lara}{mailto:32464@worldcubeassociation.org}] [{Sebastian Macias Soto}{mailto:221977@worldcubeassociation.org}]','[Plaza La Cachanilla] (https://www.google.com/maps/place/Plaza+La+Cachanilla/@32.659583,-115.4830576,16z/data=!4m6!3m5!1s0x80d77a9f7db51b4b:0xc35138bad61af6b9!8m2!3d32.658463!4d-115.4777039!16s%2Fg%2F1tqg0mcf?entry=ttu)','Blvd. Lopez Mateos s/n, Eguía, 21100 Mexicali, B.C.','Dentro de la Plaza',NULL,'5 Valles Mexicali 2025',32659104,-115479226),
('5x5onMadisonIce2023','5x5 on Madison Ice 2023','Madison, Wisconsin','USA','#### This competition will not be holding 3x3x3 Cube. \r\n\r\n##### Please read the [FAQ](https://www.worldcubeassociation.org/competitions/5x5onMadisonIce2023#34329-faq) if this is your first competition and [contact the organization team](https://www.worldcubeassociation.org/contact/website?competitionId=5x5onMadisonIce2023) if you have further questions.\r\n\r\n##### The [Venue Information](https://www.worldcubeassociation.org/competitions/5x5onMadisonIce2023#34331-venue-travel-information) tab contains important Parking, Travel, and Accommodation information for before the competition.\r\n\r\n##### This competition will be holding 3 unofficial events. You can find out more at the [Unofficial Events](https://www.worldcubeassociation.org/competitions/5x5onMadisonIce2023#34330-unofficial-events) tab.\r\n\r\nThis competition is supported by the [Midwest Cubing Association.](https://www.midwestcubing.org/)\r\n![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBbHN0IiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--50185814dd3aca6d46fbfd751cf63a2aa0a3739b/image.png)\r\n',2023,12,9,12,10,0,'222 333mbf 333oh 444 555 555bf 666 777 minx pyram skewb','[{Carter Kucala}{mailto:31001@worldcubeassociation.org}] [{Elijah Brown}{mailto:19806@worldcubeassociation.org}] [{Joshua Feran}{mailto:7944@worldcubeassociation.org}] [{Simon Kellum}{mailto:24542@worldcubeassociation.org}] [{Zeke Mackay}{mailto:19818@worldcubeassociation.org}]','[{Carter Kucala}{mailto:31001@worldcubeassociation.org}] [{Midwest Cubing Association}{mailto:310337@worldcubeassociation.org}] [{Simon Kellum}{mailto:24542@worldcubeassociation.org}] [{Zeke Mackay}{mailto:19818@worldcubeassociation.org}]','[Monona Terrace](https://www.mononaterrace.com)','1 John Nolen Dr, Madison, WI 53703','Hall of Ideas',NULL,'5x5 on Madison Ice 2023',43071556,-89380278),
('625BayArea2017','6.25 Bay Area 2017','Santa Clara, California','USA','**All competitors must read the Registration Policies prior to registering!**\r\n\r\nRegistration cost is $18.75 for any combination of events. Initial competitor limit: 150 (possibility of being raised). Please check the Events/Schedule tabs for more details.\r\n\r\nTentative events: 4x4 BLD, 5x5 BLD if there is demand. If you wish to compete in these, then you may NOT compete in Rubik\'s Cube: Fewest Moves, as these events would be run concurrently. All 4x4 BLD and 5x5 BLD competitors must judge/scramble for 4x4 BLD and 5x5 BLD when they are not competing.\r\n\r\nThis competition is a CubingUSA Supported competition.',2017,6,24,6,25,0,'222 333 333bf 333fm 333mbf 444bf 555 555bf 666 minx','[{Brandon Harnish}{mailto:41@worldcubeassociation.org}] [{Felix Lee}{mailto:266@worldcubeassociation.org}]','[{Brandon Harnish}{mailto:41@worldcubeassociation.org}] [{Neel Gore}{mailto:17643@worldcubeassociation.org}]','Adrian Wilcox High School','3250 Monroe Street, Santa Clara, CA 95051','Competition in the cafeteria on both days!',NULL,'6.25 Bay Area 2017',37366138,-121986359),
('6byRoad6Israel2023','6 by Road 6 Israel 2023','Tzur Yitzhak','Israel','#  \r\n# **כל המתחרים חייבים לנכוח בהדרכה**\r\n# **All competitors must attend the toturial**\r\n#  **שימו לב** בתחרות הזו אין את מקצה ה3*3 הרגיל\r\n# ** This competition doesn\'t include the regular 3*3 event\r\n# ![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBa3RPIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--90b58f0b45909f055386b59242fdf456a1d67b65/1684768488121.png)\r\n\r\n',2023,10,20,10,20,1,'666 777','[{Amit Sheffer}{mailto:1802@worldcubeassociation.org}] [{Amitai Ziv}{mailto:261445@worldcubeassociation.org}] [{Daniel Atlas}{mailto:25541@worldcubeassociation.org}] [{Shmulik Kachuriner}{mailto:68200@worldcubeassociation.org}]','[{Amit Sheffer}{mailto:1802@worldcubeassociation.org}] [{Amitai Ziv}{mailto:261445@worldcubeassociation.org}] [{Ben Baron}{mailto:30243@worldcubeassociation.org}]','Event Room in an Apartment Building','Alexander St 17, Tzur Yitzhak, Israel','Event Room in an Apartment Building',NULL,'6 by Road 6 Israel 2023',32239147,34999191),
('6byRoad6Israel2024','6 by Road 6 Israel 2024','Tzur Yitzhak','Israel','![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBcVppIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--3c086b1aa9d6d98cdd67e2b1fde885600ce8fe3f/Screenshot%202024-01-17%20at%2023.39.29.png)\r\n# 6 By Road 6! This competition doesn\'t have the regular 3x3 event.\r\n# \r\n# 6 על כביש 6! בתחרות הזאת אין את מקצה ה3*3 הרגיל.\r\n# ![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBb2xRIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--57773d0aebc46f3126ef9204d93b4d0c1b819e9d/1684768488121.png)\r\n\r\n# [Follow us on Instagram!](https://www.instagram.com/speedcubing_il_official/)',2024,3,1,3,1,0,'666 777','[{Amit Sheffer}{mailto:1802@worldcubeassociation.org}] [{Amitai Ziv}{mailto:261445@worldcubeassociation.org}]','[{Amit Sheffer}{mailto:1802@worldcubeassociation.org}] [{Amitai Ziv}{mailto:261445@worldcubeassociation.org}] [{Ben Baron}{mailto:30243@worldcubeassociation.org}]','Private Address','Tzur Yitzhak Israel','The Address will be sent to all Competitors Prior to the Competitions date',NULL,'6 by Road 6 Israel 2024',32054862,34858858),
('6SidesofSilesia2017','6 Sides of Silesia 2017','Dąbrowa Górnicza','Poland','Competitor limit: 40',2017,1,14,1,14,0,'222 333 333ft 333oh 444 555','[{Piotr Kózka}{mailto:187@worldcubeassociation.org}]','[{Bartłomiej Owczarek}{mailto:5391@worldcubeassociation.org}] [{Kacper Stacha}{mailto:14649@worldcubeassociation.org}]','Centrum Aktywności Obywatelskiej w Dąbrowie Górniczej','Henryka Sienkiewicza 6A, 41-300 Dąbrowa Górnicza','Conference room ','http://6sides.polishcomps.pl/','6 Sides of Silesia 2017',50324482,19179492),
('6thGuwahatiOpen2024','6th Guwahati Open 2024','Guwahati, Assam','India','* Make sure to be available at the venue at least 15 minutes before your event starts. Late entries won\'t be allowed to participate.\n* Attend the new participates tutorial session if you\'re new to WCA competitions or unfamiliar with its rules.\n* Bring a Government ID card for verification if it\'s your first time participating in a WCA competition.\n* Participants are expected to volunteer and will be assigned with roles as judges, scramblers, or runners, with the exception of newcomers.',2024,9,21,9,22,0,'222 333 333bf 333oh 444 555 666 777 clock minx pyram skewb sq1','[{Spondon Nath}{mailto:450@worldcubeassociation.org}]','[{Kabyanil Talukdar}{mailto:17767@worldcubeassociation.org}] [{Rongghor - The School of Happiness}{mailto:442110@worldcubeassociation.org}] [{SpeedCubing Guwahati}{mailto:301433@worldcubeassociation.org}]','Birinchi Kumar Barua Khetra','Shiv Mandir Path, Krishna Nagar, Chandmari, Guwahati, Assam 781004','[New Auditorium](https://maps.app.goo.gl/cw9GN6MsiPQjPHxy6)',NULL,'6th Guwahati Open 2024',26185956,91772139),
('6x6StillinaMadisonPark2024','6x6 Still in a Madison Park 2024','Madison, Wisconsin','USA','This competition is supported by the [**Midwest Cubing Association**](https://midwestcubing.org).\n![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBZ0dEIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--a6239c56608b03fda2194e41dd545ce91819975d/MCA-Final-Logo%20(WCA%20website%20version).png)\n',2024,9,15,9,15,0,'222 333 555 666 777','[{Carter Kucala}{mailto:31001@worldcubeassociation.org}] [{Joshua Feran}{mailto:7944@worldcubeassociation.org}] [{Simon Kellum}{mailto:24542@worldcubeassociation.org}] [{Zeke Mackay}{mailto:19818@worldcubeassociation.org}]','[{Carter Kucala}{mailto:31001@worldcubeassociation.org}] [{Midwest Cubing Association}{mailto:310337@worldcubeassociation.org}] [{Simon Kellum}{mailto:24542@worldcubeassociation.org}] [{Zeke Mackay}{mailto:19818@worldcubeassociation.org}]','Brittingham Park','829 W Washington Ave Madison WI 53715','Park shelter ',NULL,'6x6 Still in a Madison Park 2024',43063517,-89398750),
('70AnosFatimaMontevideo2025','70 Años Fátima Montevideo 2025','Montevideo','Uruguay','![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6ODk2OTMsInB1ciI6ImJsb2JfaWQifX0=--5357a7036160cf087c1c56ee2439e3c02a5826d2/Dise%C3%B1o%20sin%20t%C3%ADtulo%20(1).png)\n# ![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBaGxIIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--e1a87d9563999f890af638f98836b63b2aac90c5/6u.png) Español\n\nLímite de competidores: 40.\n\n* El precio de la entrada es de $300 pesos uruguayos.\n* Esta competencia está abierta a competidores de cualquier nacionalidad, cualquier edad y a nuevos competidores, sin importar sus tiempos de resolución.\n* **COMPETIDORES NUEVOS**: deben leer [Importante](https://www.worldcubeassociation.org/competitions/70AnosFatimaMontevideo2025#59119-importante-read) y [Competidores nuevos](https://www.worldcubeassociation.org/competitions/70AnosFatimaMontevideo2025#59120-competidores-nuevos-newcomers).\n* Los competidores deben llevar sus propios puzzles (ver [Directriz 3a+++](https://www.worldcubeassociation.org/regulations/translations/spanish-american/guidelines.html#3a+++)).\n* Los competidores deben estar presentes y listos para competir cuando se los llama (ver cronograma).\n* Es importante leer toda la información disponible en la página de la competencia.\n\nAnte cualquier duda, consultar a los organizadores o a los delegados de la WCA.\n\n# ![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBaHBIIiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--bacb00caed7d0c9177dc3ea7d687667b270ce30d/6i.png) English\n\nCompetitor limit: 40.\n\n* The entrance fee is $300 (Uruguayan Pesos).\n* Competitors are responsible for providing their puzzles for the competition (see [Guideline 3a+++](https://www.worldcubeassociation.org/regulations/full/#3a+++)).\n* **NEW COMPETITORS**: You must read [Important](https://www.worldcubeassociation.org/competitions/70AnosFatimaMontevideo2025#59119-importante-read) and [New competitors](https://www.worldcubeassociation.org/competitions/70AnosFatimaMontevideo2025#59120-competidores-nuevos-newcomers).\n* Competitors must bring their own puzzles.\n* Competitors must be present and ready to compete when called (see the schedule).\n* It is important to read all the information available in the competition\'s website.\n\nFeel free to contact the organizers or the WCA Delegates.',2025,5,31,6,1,0,'222 333 333oh 444 555 clock minx pyram sq1','[{Gennaro Monetti}{mailto:48161@worldcubeassociation.org}]','[{Asociación Uruguaya de Speedcubing}{mailto:306601@worldcubeassociation.org}] [{Lucas Barrientos}{mailto:406330@worldcubeassociation.org}] [{Sebastiano Benato}{mailto:45021@worldcubeassociation.org}] [{Xabier Monsalve}{mailto:234651@worldcubeassociation.org}]','[Colegio Fátima](https://www.colegioyliceofatima.edu.uy/)','General José Esteban Brito del Pino 1344, 11300 Montevideo, Uruguay','Entrada por Silvestre Blanco',NULL,'70 Años Fátima Montevideo 2025',-34904381,-56157776),
('75porCientoBogota2023','75 por Ciento Bogotá 2023','Bogotá','Colombia','Organizadores/Organizers:\r\n\r\nDennis Rosero\r\nEduard García\r\n\r\nPatrocinadores/Sponsors:\r\n\r\nCentro Comercial Portal 80\r\nEduRubiks Store',2023,2,26,2,26,0,'222 333 pyram skewb','[{Dennis Rosero}{mailto:5593@worldcubeassociation.org}] [{José Leonardo Chaparro Prieto}{mailto:5621@worldcubeassociation.org}]','[{Dennis Rosero}{mailto:5593@worldcubeassociation.org}] [{Eduard Esteban García Domínguez}{mailto:5587@worldcubeassociation.org}]','Centro Comercial Portal 80','Carrera 100A # 80A-20','First Floor Koaj, Mall Portal 80',NULL,'75 por Ciento Bogotá 2023',4710608,-74112246),
('75porcientoBogota2025','75 por ciento Bogotá 2025','Bogotá','Colombia','Organizadores/Organizers:\n\nEduard García\n\nPatrocinadores/Sponsors:\n\nCentro Comercial Portal 80\nEduRubiks Store',2025,10,18,10,18,0,'222 333 pyram skewb','[{Manuel Popayán}{mailto:42265@worldcubeassociation.org}]','[{Dennis Rosero}{mailto:5593@worldcubeassociation.org}] [{Eduard Esteban García Domínguez}{mailto:5587@worldcubeassociation.org}] [{Speedcubing Colombia}{mailto:324522@worldcubeassociation.org}]','Centro Comercial Portal 80','Carrera 100A # 80A-20','Piso 2',NULL,'75 por ciento Bogotá 2025',4710608,-74112246),
('75porCientoIIBogota2023','75 por Ciento II Bogotá 2023','Bogotá','Colombia','Organizadores/Organizers:\r\n\r\nDennis Rosero\r\n\r\n\r\nPatrocinadores/Sponsors:\r\n\r\nCentro Comercial Portal 80\r\nEdurubiks Store',2023,5,7,5,7,0,'333 333oh minx sq1','[{Dennis Rosero}{mailto:5593@worldcubeassociation.org}] [{José Leonardo Chaparro Prieto}{mailto:5621@worldcubeassociation.org}]','[{Catalina Herrera López}{mailto:53608@worldcubeassociation.org}] [{Dennis Rosero}{mailto:5593@worldcubeassociation.org}] [{Eduard Esteban García Domínguez}{mailto:5587@worldcubeassociation.org}] [{Francia Perez}{mailto:103025@worldcubeassociation.org}]','Centro Comercial Portal 80','Carrera 100A # 80A-20','First Floor Koaj, Mall Portal 80',NULL,'75 por Ciento II Bogotá 2023',4710480,-74111795),
('7x7MadisonPark2022','7x7 in a Madison Park 2022','Madison, Wisconsin','USA','The competition is held in an open air park shelter.\r\n\r\nMasks are required while competiting, judging and scrambling. \r\n\r\n\r\nGuests and spectatiors are allowed at this competition.',2022,9,25,9,25,0,'333fm 666 777 clock','[{Joshua Feran}{mailto:7944@worldcubeassociation.org}]','[{Dalton Padgett}{mailto:29014@worldcubeassociation.org}] [{Daniel Mullen}{mailto:30903@worldcubeassociation.org}] [{Joshua Feran}{mailto:7944@worldcubeassociation.org}]','Brittingham Park','829 W Washington Ave Madison WI 53715','Park shelter ',NULL,'7x7 in a Madison Park 2022',43063517,-89398750),
('8WingLimited2019','8 Wing Limited 2019','Astra, Ontario','Canada','See tabs for more information.',2019,4,6,4,6,0,'333 333bf 333mbf 333oh 444bf minx sq1','[{Sarah Strong}{mailto:1352@worldcubeassociation.org}]','[{Anonymous}{mailto:11266@worldcubeassociation.org}] [{Sarah Strong}{mailto:1352@worldcubeassociation.org}]','Astra Lounge at 8 Wing Air Force Base','106 Yukon St, Astra, ON, K0K 3W0','The entrance is on Yukon Street. Signs will be posted.',NULL,'8 Wing Limited 2019',44107721,-77532784),
('AAAbresiens2025','Algorithmes Artistiques Abrésiens 2025','Les Abrets en Dauphiné','France','L’inscription est **gratuite** pour les **nouveaux compétiteurs** ainsi que les [**adhérents AFS**](https://www.speedcubingfrance.org/association/adhesion). Si ce n\'est pas votre cas, l\'inscription coûte 5€.\nMerci de lire attentivement les **conditions d\'inscription, la [FAQ](https://www.worldcubeassociation.org/competitions/AAAbresiens2025#62737-foire-aux-questions-frequently-asked-questions) et les [tutoriels AFS](https://www.speedcubingfrance.org/speedcubing/tutos)**. \nPensez également à consulter l\'onglet [Planning](#competition-schedule). \n\n----\nRegistration is **free** for **new competitors** as well as [**AFS members**](https://www.speedcubingfrance.org/association/adhesion), no matter your citizenship or place of residence. Otherwise registration costs 5€.\nPlease read the **registration conditions, the [FAQ](https://www.worldcubeassociation.org/competitions/AAAbresiens2025#62737-foire-aux-questions-frequently-asked-questions) and the [AFS tutorials](https://www.speedcubingfrance.org/speedcubing/tutos) carefully**.\nMake sure to read the [Schedule](#competition-schedule) tab. ',2025,11,15,11,16,0,'222 333 333bf 333mbf 444 555 666 777 clock minx pyram sq1','[{Adrien Neveu}{mailto:79829@worldcubeassociation.org}] [{Manon Bernard}{mailto:338869@worldcubeassociation.org}]','[{Basile Chandon}{mailto:212930@worldcubeassociation.org}] [{Étienne Aubry}{mailto:67140@worldcubeassociation.org}] [{Manon Bernard}{mailto:338869@worldcubeassociation.org}] [{Nox Clémenceau}{mailto:16640@worldcubeassociation.org}] [{Romain Moreau}{mailto:295453@worldcubeassociation.org}]','Salle Vercors','185-541 Rte de la Reverdière, 38490 Les Abrets en Dauphiné, France','Salle des Fetes de la Ville, entrée principale',NULL,'AAAbrésiens 2025',45546209,5570745),
('AachenOpen2009','Aachen Open 2009','Aachen','Germany','',2009,1,10,1,11,0,'222 333 333bf 333fm 333mbf 333mbo 333oh 444 444bf 555 555bf clock magic minx mmagic pyram sq1','[{Ron van Bruchem}{mailto:1@worldcubeassociation.org}]',NULL,'[Studentenwerk Aachen](http://www.studentenwerk-aachen.de/willkommen.asp)','Turmstrasse 3, 52072 Aachen','Theatersaal','http://cube.hackvalue.de/ao09/','Aachen Open 2009',50781529,6075948),
('AachenOpen2010','Aachen Open 2010','Aachen','Germany','',2010,1,16,1,17,0,'222 333 333bf 333fm 333mbf 333oh 444 444bf 555 555bf 666 777 clock magic minx mmagic pyram sq1','[{Sébastien Auroux}{mailto:2@worldcubeassociation.org}]','[{Sébastien Auroux}{mailto:2@worldcubeassociation.org}]','RWTH Aachen University','Ahornstraße 55, 52074 Aachen','Lecture Hall Aula II,  Computer Science Building','http://aachen.speedcubing.com/ao10/','Aachen Open 2010',50776585,6083612),
('AachenOpen2011','Aachen Open 2011','Aachen','Germany','',2011,1,14,1,16,0,'222 333 333bf 333fm 333mbf 333oh 444 444bf 555 555bf 666 777 clock magic minx mmagic pyram sq1','[{Sébastien Auroux}{mailto:2@worldcubeassociation.org}]','[{Sébastien Auroux}{mailto:2@worldcubeassociation.org}]','RWTH Aachen University','Ahornstraße 55, 52074 Aachen','Lecture Hall Aula II,  Computer Science Building','http://aachen.speedcubing.com/ao11/','Aachen Open 2011',50778901,6059067);
/*!40000 ALTER TABLE `Competitions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Continents`
--

DROP TABLE IF EXISTS `Continents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Continents` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `recordName` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `latitude` int NOT NULL DEFAULT '0',
  `longitude` int NOT NULL DEFAULT '0',
  `zoom` tinyint NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Continents`
--

LOCK TABLES `Continents` WRITE;
/*!40000 ALTER TABLE `Continents` DISABLE KEYS */;
INSERT INTO `Continents` VALUES
('_Africa','Africa','AfR',213671,16984850,3),
('_Asia','Asia','AsR',34364439,108330700,2),
('_Europe','Europe','ER',58299984,23049300,3),
('_Multiple Continents','Multiple Continents','',0,0,1),
('_North America','North America','NAR',45486546,-93449700,3),
('_Oceania','Oceania','OcR',-25274398,133775136,3),
('_South America','South America','SAR',-21735104,-63281250,3);
/*!40000 ALTER TABLE `Continents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Countries`
--

DROP TABLE IF EXISTS `Countries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Countries` (
  `id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `continentId` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `iso2` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Countries`
--

LOCK TABLES `Countries` WRITE;
/*!40000 ALTER TABLE `Countries` DISABLE KEYS */;
INSERT INTO `Countries` VALUES
('Afghanistan','Afghanistan','_Asia','AF'),
('Albania','Albania','_Europe','AL'),
('Algeria','Algeria','_Africa','DZ'),
('Andorra','Andorra','_Europe','AD'),
('Angola','Angola','_Africa','AO'),
('Antigua and Barbuda','Antigua and Barbuda','_North America','AG'),
('Argentina','Argentina','_South America','AR'),
('Armenia','Armenia','_Europe','AM'),
('Australia','Australia','_Oceania','AU'),
('Austria','Austria','_Europe','AT'),
('Azerbaijan','Azerbaijan','_Europe','AZ'),
('Bahamas','Bahamas','_North America','BS'),
('Bahrain','Bahrain','_Asia','BH'),
('Bangladesh','Bangladesh','_Asia','BD'),
('Barbados','Barbados','_North America','BB'),
('Belarus','Belarus','_Europe','BY'),
('Belgium','Belgium','_Europe','BE'),
('Belize','Belize','_North America','BZ'),
('Benin','Benin','_Africa','BJ'),
('Bhutan','Bhutan','_Asia','BT'),
('Bolivia','Bolivia','_South America','BO'),
('Bosnia and Herzegovina','Bosnia and Herzegovina','_Europe','BA'),
('Botswana','Botswana','_Africa','BW'),
('Brazil','Brazil','_South America','BR'),
('Brunei','Brunei','_Asia','BN'),
('Bulgaria','Bulgaria','_Europe','BG'),
('Burkina Faso','Burkina Faso','_Africa','BF'),
('Burundi','Burundi','_Africa','BI'),
('Cabo Verde','Cabo Verde','_Africa','CV'),
('Cambodia','Cambodia','_Asia','KH'),
('Cameroon','Cameroon','_Africa','CM'),
('Canada','Canada','_North America','CA'),
('Central African Republic','Central African Republic','_Africa','CF'),
('Chad','Chad','_Africa','TD'),
('Chile','Chile','_South America','CL'),
('China','China','_Asia','CN'),
('Colombia','Colombia','_South America','CO'),
('Comoros','Comoros','_Africa','KM'),
('Congo','Congo','_Africa','CG'),
('Costa Rica','Costa Rica','_North America','CR'),
('Cote d_Ivoire','Côte d\'Ivoire','_Africa','CI'),
('Croatia','Croatia','_Europe','HR'),
('Cuba','Cuba','_North America','CU'),
('Cyprus','Cyprus','_Europe','CY'),
('Czech Republic','Czech Republic','_Europe','CZ'),
('Democratic People_s Republic of Korea','Democratic People\'s Republic of Korea','_Asia','KP'),
('Democratic Republic of the Congo','Democratic Republic of the Congo','_Africa','CD'),
('Denmark','Denmark','_Europe','DK'),
('Djibouti','Djibouti','_Africa','DJ'),
('Dominica','Dominica','_North America','DM'),
('Dominican Republic','Dominican Republic','_North America','DO'),
('Ecuador','Ecuador','_South America','EC'),
('Egypt','Egypt','_Africa','EG'),
('El Salvador','El Salvador','_North America','SV'),
('Equatorial Guinea','Equatorial Guinea','_Africa','GQ'),
('Eritrea','Eritrea','_Africa','ER'),
('Estonia','Estonia','_Europe','EE'),
('Eswatini','Eswatini','_Africa','SZ'),
('Ethiopia','Ethiopia','_Africa','ET'),
('Federated States of Micronesia','Federated States of Micronesia','_Oceania','FM'),
('Fiji','Fiji','_Oceania','FJ'),
('Finland','Finland','_Europe','FI'),
('France','France','_Europe','FR'),
('Gabon','Gabon','_Africa','GA'),
('Gambia','Gambia','_Africa','GM'),
('Georgia','Georgia','_Europe','GE'),
('Germany','Germany','_Europe','DE'),
('Ghana','Ghana','_Africa','GH'),
('Greece','Greece','_Europe','GR'),
('Grenada','Grenada','_North America','GD'),
('Guatemala','Guatemala','_North America','GT'),
('Guinea','Guinea','_Africa','GN'),
('Guinea Bissau','Guinea Bissau','_Africa','GW'),
('Guyana','Guyana','_South America','GY'),
('Haiti','Haiti','_North America','HT'),
('Honduras','Honduras','_North America','HN'),
('Hong Kong','Hong Kong, China','_Asia','HK'),
('Hungary','Hungary','_Europe','HU'),
('Iceland','Iceland','_Europe','IS'),
('India','India','_Asia','IN'),
('Indonesia','Indonesia','_Asia','ID'),
('Iran','Iran','_Asia','IR'),
('Iraq','Iraq','_Asia','IQ'),
('Ireland','Ireland','_Europe','IE'),
('Israel','Israel','_Europe','IL'),
('Italy','Italy','_Europe','IT'),
('Jamaica','Jamaica','_North America','JM'),
('Japan','Japan','_Asia','JP'),
('Jordan','Jordan','_Asia','JO'),
('Kazakhstan','Kazakhstan','_Asia','KZ'),
('Kenya','Kenya','_Africa','KE'),
('Kiribati','Kiribati','_Oceania','KI'),
('Korea','Republic of Korea','_Asia','KR'),
('Kosovo','Kosovo','_Europe','XK'),
('Kuwait','Kuwait','_Asia','KW'),
('Kyrgyzstan','Kyrgyzstan','_Asia','KG'),
('Laos','Laos','_Asia','LA'),
('Latvia','Latvia','_Europe','LV'),
('Lebanon','Lebanon','_Asia','LB'),
('Lesotho','Lesotho','_Africa','LS');
/*!40000 ALTER TABLE `Countries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Events`
--

DROP TABLE IF EXISTS `Events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Events` (
  `id` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `name` varchar(54) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `rank` int NOT NULL DEFAULT '0',
  `format` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `cellName` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Events`
--

LOCK TABLES `Events` WRITE;
/*!40000 ALTER TABLE `Events` DISABLE KEYS */;
INSERT INTO `Events` VALUES
('222','2x2x2 Cube',20,'time','2x2x2 Cube'),
('333','3x3x3 Cube',10,'time','3x3x3 Cube'),
('333bf','3x3x3 Blindfolded',70,'time','3x3x3 Blindfolded'),
('333fm','3x3x3 Fewest Moves',80,'number','3x3x3 Fewest Moves'),
('333ft','3x3x3 With Feet',996,'time','3x3x3 With Feet'),
('333mbf','3x3x3 Multi-Blind',180,'multi','3x3x3 Multi-Blind'),
('333mbo','3x3x3 Multi-Blind Old Style',999,'multi','3x3x3 Multi-Blind Old Style'),
('333oh','3x3x3 One-Handed',90,'time','3x3x3 One-Handed'),
('444','4x4x4 Cube',30,'time','4x4x4 Cube'),
('444bf','4x4x4 Blindfolded',160,'time','4x4x4 Blindfolded'),
('555','5x5x5 Cube',40,'time','5x5x5 Cube'),
('555bf','5x5x5 Blindfolded',170,'time','5x5x5 Blindfolded'),
('666','6x6x6 Cube',50,'time','6x6x6 Cube'),
('777','7x7x7 Cube',60,'time','7x7x7 Cube'),
('clock','Clock',110,'time','Clock'),
('magic','Magic',997,'time','Magic'),
('minx','Megaminx',120,'time','Megaminx'),
('mmagic','Master Magic',998,'time','Master Magic'),
('pyram','Pyraminx',130,'time','Pyraminx'),
('skewb','Skewb',140,'time','Skewb'),
('sq1','Square-1',150,'time','Square-1');
/*!40000 ALTER TABLE `Events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Formats`
--

DROP TABLE IF EXISTS `Formats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Formats` (
  `id` varchar(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `sort_by` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_by_second` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expected_solve_count` int NOT NULL,
  `trim_fastest_n` int NOT NULL,
  `trim_slowest_n` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Formats`
--

LOCK TABLES `Formats` WRITE;
/*!40000 ALTER TABLE `Formats` DISABLE KEYS */;
INSERT INTO `Formats` VALUES
('1','Best of 1','single','average',1,0,0),
('2','Best of 2','single','average',2,0,0),
('3','Best of 3','single','average',3,0,0),
('a','Average of 5','average','single',5,1,1),
('m','Mean of 3','average','single',3,0,0);
/*!40000 ALTER TABLE `Formats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Persons`
--

DROP TABLE IF EXISTS `Persons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Persons` (
  `id` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `subid` tinyint NOT NULL DEFAULT '1',
  `name` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `countryId` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `gender` varchar(1) COLLATE utf8mb4_unicode_ci DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Persons`
--

LOCK TABLES `Persons` WRITE;
/*!40000 ALTER TABLE `Persons` DISABLE KEYS */;
INSERT INTO `Persons` VALUES
('1982BORS01',1,'Jozsef Borsos','Serbia','m'),
('1982BRIN01',1,'Roland Brinkmann','Germany','m'),
('1982CHIL01',1,'Julian Chilvers','United Kingdom','m'),
('1982FRID01',1,'Jessica Fridrich','USA','f'),
('1982FRID01',2,'Jessica Fridrich','Czech Republic','f'),
('1982GALR01',1,'Manuel Galrinho','Portugal','m'),
('1982JEAN01',1,'Jerome Jean-Charles','France','m'),
('1982LABA01',1,'Zoltán Lábas','Hungary','m'),
('1982LAET01',1,'Luc Van Laethem','Belgium','m'),
('1982PETR01',1,'Lars Petrus','Sweden','m'),
('1982RAZO01',1,'Guus Razoux Schultz','Netherlands','m'),
('1982ROME01',1,'Giuseppe Romeo','Italy','m'),
('1982SAND01',1,'Jari Sandqvist','Finland','m'),
('1982SEBE01',1,'Piotr Serbeński','Poland','m'),
('1982TENE01',1,'Svilen Tenev','Bulgaria','m'),
('1982THAI01',1,'Minh Thai','USA','m'),
('1982TRAJ01',1,'Josef Trajber','Austria','m'),
('1982TRIN01',1,'Duc Trinh','Canada','m'),
('1982UENO01',1,'Ken\'ichi Ueno (上野健一)','Japan','m'),
('1982VALD01',1,'Eduardo Valdivia Chacon','Peru','m'),
('2003AKIM01',1,'Masayuki Akimoto (秋元正行)','Japan','m'),
('2003ALGA01',1,'Rafael Algarin','USA','m'),
('2003ALLE01',1,'David Allen','USA','m'),
('2003ALLE02',1,'Joe Allen','USA','m'),
('2003ATKI01',1,'Michael Atkinson','USA','m'),
('2003ATTA01',1,'Paul Attar','Canada','m'),
('2003BABC01',1,'Peter Babcock','USA','m'),
('2003BADI01',1,'Frédérick Badie','France','m'),
('2003BARR01',1,'David Barr','USA','m'),
('2003BARR02',1,'Joe Barratt','United Kingdom','m'),
('2003BELL01',1,'Andy Bellenir','USA','m'),
('2003BLON01',1,'Michiel van der Blonk','Netherlands','m'),
('2003BLUS01',1,'Iliya Bluskov','Canada','m'),
('2003BOND01',1,'Jess Bonde','Denmark','m'),
('2003BOUT01',1,'Jonathan Bouthilet','USA','m'),
('2003BRAN01',1,'Kenneth Brandon','USA','m'),
('2003BRAN02',1,'Kevin Brandon','USA','m'),
('2003BRAN03',1,'Wes Brandon','Canada','m'),
('2003BRUC01',1,'Ron van Bruchem','Netherlands','m'),
('2003BURT01',1,'Bob Burton','USA','m'),
('2003BUTL01',1,'Rob Butler','USA','m'),
('2003CAMA01',1,'Andy Camann','USA','m'),
('2003CEGE01',1,'Nick Cegelka','USA','m'),
('2003DENN01',1,'Ton Dennenbroek','Netherlands','m'),
('2003DUFO01',1,'Corey Duford','Canada','m'),
('2003EAST01',1,'Justin Eastman','Canada','m'),
('2003FALM01',1,'Michal Falmyk','Canada','m'),
('2003GOET01',1,'Jeff Goetz','USA','m'),
('2003GOLJ01',1,'Mirek Goljan','Czech Republic','m'),
('2003GOOD01',1,'Jay Goodell','USA','m'),
('2003GRAN01',1,'Carvo Grant','USA','m'),
('2003HARD01',1,'Chris Hardwick','USA','m'),
('2003HARN01',1,'Cory Harnish','Canada','m'),
('2003HARR01',1,'Dan Harris','United Kingdom','m'),
('2003HAZR01',1,'Shiraz Hazrat','USA','m'),
('2003HELT01',1,'Koen Heltzel','Netherlands','m'),
('2003HILD01',1,'Jason Hildebrand','USA','m'),
('2003JANS01',1,'Peter Jansen','Netherlands','m'),
('2003JOHA01',1,'Eric Johanson','USA','m'),
('2003JOZW01',1,'Kirt Jozwiak','USA','m'),
('2003KNAP01',1,'Ryan Knapton','USA','m'),
('2003KNIG01',1,'Dan Knights','USA','m'),
('2003KNIG02',1,'Elizabeth Knights','USA','f'),
('2003KONI01',1,'Katsuyuki Konishi (小西克幸)','Japan','m'),
('2003LARS01',1,'Anders Larsson','Sweden','m'),
('2003LEBL01',1,'Benjamin LeBlond','Canada','m'),
('2003LEEJ01',1,'Jasmine Lee','Australia','f'),
('2003LICH01',1,'Marty Licht','USA','m'),
('2003LIDO01',1,'Doug Li','USA','m'),
('2003LITT01',1,'Heath Litton','USA','m'),
('2003LONG01',1,'Mark Longridge','Canada','m'),
('2003MAKI01',1,'Shotaro Makisumi (牧角章太郎)','Japan','m'),
('2003MART01',1,'Frédéric Martineau','Canada','m'),
('2003MEAN01',1,'Gene Means','USA','m'),
('2003MITT01',1,'Jim Mittan','USA','m'),
('2003MORG01',1,'Brent Morgan','USA','m'),
('2003MORR01',1,'Frank Morris','USA','m'),
('2003MORR02',1,'Jon Morris','USA','m'),
('2003PAPI01',1,'Suzanne Papin','USA','f'),
('2003PATT01',1,'Richard Patterson','USA','m'),
('2003PETE01',1,'Bob Peters','Canada','m'),
('2003POCH01',1,'Stefan Pochmann','Germany','m'),
('2003POUR01',1,'Yasmara Pourrier','Netherlands','f'),
('2003POWE01',1,'Michael Powers','USA','m'),
('2003RAST01',1,'Iman Rastegari','USA','m'),
('2003RUET01',1,'Jake Rueth','USA','m'),
('2003SAUE01',1,'Keith Sauer','USA','m'),
('2003SAVO01',1,'Andy Savoy','USA','m'),
('2003SCHE01',1,'Jaap Scherphuis','Netherlands','m'),
('2003SLAT01',1,'Adam Slate','USA','m'),
('2003STAU01',1,'Guido Staub','Switzerland','m'),
('2003SWAN01',1,'Kevin Swan','Canada','m'),
('2003SWAR01',1,'Dave Swart','Canada','m'),
('2003SWAR02',1,'Michael Swart','Canada','m'),
('2003TEMP01',1,'Thomas Templier','France','m'),
('2003THOM01',1,'Sandy Thompson','Canada','m'),
('2003TING01',1,'Matthew Tingle','Canada','m'),
('2003TREG01',1,'Betty Tregay','USA','f'),
('2003TREG02',1,'Grant Tregay','USA','m'),
('2003VAND01',1,'Lars Vandenbergh','Belgium','m');
/*!40000 ALTER TABLE `Persons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `RanksAverage`
--

DROP TABLE IF EXISTS `RanksAverage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `RanksAverage` (
  `personId` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `eventId` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `best` int NOT NULL DEFAULT '0',
  `worldRank` int NOT NULL DEFAULT '0',
  `continentRank` int NOT NULL DEFAULT '0',
  `countryRank` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RanksAverage`
--

LOCK TABLES `RanksAverage` WRITE;
/*!40000 ALTER TABLE `RanksAverage` DISABLE KEYS */;
INSERT INTO `RanksAverage` VALUES
('2019WANY36','222',88,1,1,1),
('2022PHAN03','222',90,2,2,1),
('2018KHAN28','222',92,3,1,1),
('2016FEIS01','222',93,4,2,2),
('2012PATE01','222',97,5,1,1),
('2021ZAJD03','222',97,5,1,1),
('2023TULL04','222',100,7,3,1),
('2022RUDA02','222',102,8,1,1),
('2022SCHE13','222',107,9,4,1),
('2021YEZI01','222',107,9,3,2),
('2022VISH01','222',109,11,5,1),
('2017TSVE02','222',109,11,5,1),
('2018KUZM02','222',110,13,7,2),
('2022STOJ03','222',111,14,8,3),
('2022CHAI02','222',111,14,3,3),
('2022DINC01','222',113,16,4,4),
('2017GARR05','222',113,16,4,4),
('2018PATT04','222',114,18,2,2),
('2018ALON07','222',115,19,9,2),
('2023MALO01','222',115,19,6,6),
('2023LARR09','222',115,19,9,1),
('2021PIET01','222',116,22,11,4),
('2021DUNA01','222',116,22,7,7),
('2022CHEN37','222',117,24,8,8),
('2020REDD01','222',117,24,8,8),
('2022NUNE03','222',117,24,8,8),
('2017BASH04','222',117,24,12,2),
('2016LIJI05','222',117,24,4,3),
('2013JOHN10','222',118,29,11,11),
('2022STOU01','222',118,29,11,11),
('2019HUAH03','222',119,31,5,4),
('2021SOTO01','222',119,31,1,1),
('2013EGDA02','222',119,31,13,1),
('2012CALL01','222',119,31,13,13),
('2018ZHUA10','222',120,35,14,14),
('2019GAOY01','222',121,36,6,5),
('2022GLAD01','222',121,36,14,5),
('2020BURN06','222',122,38,15,3),
('2022COST03','222',122,38,15,1),
('2019TARA09','222',122,38,15,3),
('2021ZAJD02','222',123,41,18,6),
('2021EDEN01','222',124,42,19,2),
('2023SHOJ01','222',124,42,15,15),
('2023SEVE03','222',124,42,15,15),
('2023XIAT01','222',124,42,7,6),
('2016THAK01','222',124,42,7,1),
('2016JONE04','222',124,42,3,3),
('2017LIXU06','222',125,48,9,7),
('2023YUHA01','222',125,48,9,7),
('2022CIEP01','222',125,48,20,7),
('2022ORBA01','222',125,48,20,1),
('2016LINB01','222',126,52,17,1),
('2013GERH01','222',127,53,22,1),
('2013MARC05','222',127,53,22,1),
('2015SANC11','222',127,53,18,17),
('2021YEXA01','222',127,53,18,17),
('2021CHEL01','222',128,57,24,2),
('2022JOHN14','222',128,57,4,1),
('2018CREE01','222',128,57,20,19),
('2016GUOS02','222',129,60,11,1),
('2016JENS09','222',129,60,25,3),
('2016PILA03','222',129,60,21,20),
('2017HERN11','222',129,60,21,1),
('2015SANT44','222',131,64,23,21),
('2023FANG02','222',131,64,26,4),
('2023LAVO01','222',132,66,24,2),
('2021ZHAN01','222',132,66,12,9),
('2022VERA02','222',132,66,2,1),
('2022IVAR01','222',132,66,27,4),
('2019YAOJ01','222',132,66,24,22),
('2015LARS04','222',132,66,27,1),
('2018KHAN26','222',134,72,26,23),
('2018LIUN01','222',134,72,29,26),
('2017CHOI07','222',134,72,13,1),
('2023SWIT03','222',134,72,29,2),
('2018WANG35','222',134,72,13,10),
('2015CHER07','222',135,77,27,24),
('2016CHAN09','222',135,77,16,2),
('2016KOLA02','222',135,77,30,8),
('2012PANJ02','222',135,77,16,12),
('2014CZAP01','222',135,77,30,8),
('2017XURU04','222',136,82,18,13),
('2015VANL01','222',136,82,28,25),
('2019MAGU04','222',136,82,3,1),
('2023MAGA09','222',136,82,18,1),
('2022MATY01','222',136,82,32,2),
('2022MULL02','222',137,87,33,2),
('2022FEDE01','222',137,87,33,1),
('2019VUJC01','222',137,87,5,2),
('2022ADAM01','222',137,87,5,4),
('2021LILI03','222',137,87,20,14),
('2014DETL01','222',137,87,33,2),
('2017NIEL03','222',137,87,29,26),
('2015QUAN03','222',137,87,20,1),
('2016OCHS01','222',138,95,31,28),
('2017ZHAQ04','222',138,95,22,15),
('2021LABE01','222',138,95,36,10),
('2021ZHUA01','222',138,95,22,15),
('2022FRED05','222',138,95,22,2),
('2022KEET01','222',138,95,22,2);
/*!40000 ALTER TABLE `RanksAverage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `RanksSingle`
--

DROP TABLE IF EXISTS `RanksSingle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `RanksSingle` (
  `personId` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `eventId` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `best` int NOT NULL DEFAULT '0',
  `worldRank` int NOT NULL DEFAULT '0',
  `continentRank` int NOT NULL DEFAULT '0',
  `countryRank` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RanksSingle`
--

LOCK TABLES `RanksSingle` WRITE;
/*!40000 ALTER TABLE `RanksSingle` DISABLE KEYS */;
INSERT INTO `RanksSingle` VALUES
('2021YEZI01','222',39,1,1,1),
('2016GUOS02','222',41,2,2,1),
('2021ZAJD03','222',43,3,1,1),
('2013MARC05','222',44,4,2,1),
('2023XIAT01','222',45,5,3,2),
('2019WANY36','222',46,6,4,3),
('2018WANG35','222',47,7,5,4),
('2022JOHN14','222',47,7,1,1),
('2021LEES01','222',49,9,2,1),
('2023LARR09','222',49,9,3,1),
('2014CZAP01','222',49,9,3,2),
('2018KHAN28','222',50,12,1,1),
('2017GARR05','222',51,13,2,2),
('2017AGGA01','222',51,13,2,2),
('2023JURI01','222',51,13,5,1),
('2022MULL02','222',52,16,6,1),
('2022STOJ03','222',52,16,6,3),
('2015ZUBO01','222',52,16,6,3),
('2014RZEW01','222',52,16,6,3),
('2017CHOI07','222',53,20,6,1),
('2016JONE04','222',53,20,3,2),
('2018KUZM02','222',53,20,10,6),
('2022FRED05','222',54,23,7,1),
('2022FEDE01','222',54,23,11,1),
('2022RUDA02','222',54,23,4,3),
('2019MORG10','222',54,23,11,1),
('2017PABI01','222',54,23,11,7),
('2019HUAH03','222',55,28,8,5),
('2019GAOY01','222',56,29,9,6),
('2022TURN10','222',56,29,14,2),
('2017MART94','222',56,29,4,1),
('2007VALK01','222',56,29,14,1),
('2014MILL04','222',56,29,5,2),
('2016DEXT01','222',57,34,6,4),
('2015LARS04','222',57,34,16,1),
('2023DINE06','222',57,34,16,1),
('2023CARE06','222',57,34,5,4),
('2018HANU02','222',57,34,16,8),
('2021RAVI01','222',57,34,6,4),
('2021PIET01','222',57,34,16,8),
('2021NGUY04','222',58,41,8,6),
('2019VUJC01','222',58,41,8,3),
('2018LINH02','222',58,41,8,6),
('2023LAVO01','222',58,41,6,1),
('2017HERN11','222',58,41,6,2),
('2016FEIS01','222',58,41,6,5),
('2016SANT08','222',58,41,6,1),
('2011SBAH01','222',58,41,6,5),
('2013BURL01','222',59,49,20,10),
('2013KRAS02','222',59,49,20,10),
('2016ROLZ01','222',59,49,20,1),
('2016POLA01','222',59,49,11,7),
('2017ENGB01','222',59,49,11,8),
('2021SOTO01','222',59,49,1,1),
('2022CHEN37','222',59,49,11,7),
('2019MAGU04','222',59,49,1,1),
('2021MALI02','222',59,49,20,10),
('2021CHEL01','222',59,49,20,2),
('2022PHAN03','222',59,49,10,1),
('2018FOST03','222',60,60,12,4),
('2018KANE03','222',60,60,25,1),
('2018DREI02','222',60,60,25,1),
('2019SART01','222',60,60,25,1),
('2015HEJU02','222',60,60,12,9),
('2017SARE03','222',60,60,13,3),
('2016KOLA02','222',60,60,25,13),
('2014ZYCH01','222',60,60,25,13),
('2023KOWA07','222',60,60,25,13),
('2019TARA09','222',61,69,31,2),
('2022RATT01','222',61,69,14,10),
('2018KOLO06','222',61,69,31,2),
('2018MUSI03','222',61,69,31,16),
('2015SALO01','222',61,69,31,2),
('2015WANG09','222',61,69,11,1),
('2016LIJI05','222',61,69,11,7),
('2016LINB01','222',61,69,14,4),
('2011REED01','222',61,69,14,9),
('2017TRUC02','222',61,69,14,9),
('2014KIPR01','222',62,79,15,11),
('2015CHEN56','222',62,79,13,2),
('2015BART05','222',62,79,17,11),
('2012CALL01','222',62,79,17,11),
('2015KUCA01','222',62,79,17,11),
('2022STEF06','222',62,79,35,1),
('2018RUSH01','222',62,79,1,1),
('2018LAPE01','222',63,86,3,1),
('2020MOCO01','222',63,86,16,12),
('2021FARE01','222',63,86,16,12),
('2021SEUF01','222',63,86,16,12),
('2022HETH01','222',63,86,16,5),
('2022MATY02','222',63,86,36,17),
('2022MARC05','222',63,86,36,17),
('2014ROME06','222',63,86,20,3),
('2014OMIA01','222',63,86,36,17),
('2016PFEI01','222',63,86,20,14),
('2016QUIN01','222',63,86,20,14),
('2016OCON02','222',64,97,39,2),
('2016TRAG01','222',64,97,23,16),
('2016THOR08','222',64,97,39,1),
('2009LIUE01','222',64,97,23,16);
/*!40000 ALTER TABLE `RanksSingle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Results`
--

DROP TABLE IF EXISTS `Results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Results` (
  `competitionId` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `eventId` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `roundTypeId` varchar(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `pos` smallint NOT NULL DEFAULT '0',
  `best` int NOT NULL DEFAULT '0',
  `average` int NOT NULL DEFAULT '0',
  `personName` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `personId` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `personCountryId` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `formatId` varchar(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `value1` int NOT NULL DEFAULT '0',
  `value2` int NOT NULL DEFAULT '0',
  `value3` int NOT NULL DEFAULT '0',
  `value4` int NOT NULL DEFAULT '0',
  `value5` int NOT NULL DEFAULT '0',
  `regionalSingleRecord` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `regionalAverageRecord` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Results`
--

LOCK TABLES `Results` WRITE;
/*!40000 ALTER TABLE `Results` DISABLE KEYS */;
INSERT INTO `Results` VALUES
('LyonOpen2007','333','1',15,1968,2128,'Etienne Amany','2007AMAN01','Cote d_Ivoire','a',1968,2203,2138,2139,2108,'AfR','AfR'),
('LyonOpen2007','333','1',16,1731,2140,'Thomas Rouault','2004ROUA01','France','a',2222,2153,1731,2334,2046,NULL,NULL),
('LyonOpen2007','333','1',17,2305,2637,'Antoine Simon-Chautemps','2005SIMO01','France','a',3430,2581,2540,2789,2305,NULL,NULL),
('LyonOpen2007','333','1',18,2452,2637,'Irène Mallordy','2007MALL01','France','a',2715,2452,2868,2632,2564,NULL,NULL),
('LyonOpen2007','333','1',19,2677,2906,'Marlène Desmaisons','2007DESM01','France','a',2921,3184,2891,2677,2907,NULL,NULL),
('LyonOpen2007','333','1',20,1869,2910,'Ton Dennenbroek','2003DENN01','Netherlands','a',3309,1869,2558,2930,3241,NULL,NULL),
('LyonOpen2007','333','1',21,2411,2910,'Arnaud van Galen','2006GALE01','Netherlands','a',2530,2696,2411,5512,3503,NULL,NULL),
('LyonOpen2007','333','1',22,2385,3111,'Cyrille Cornu','2007CORN01','France','a',2844,3861,2628,3885,2385,NULL,NULL),
('LyonOpen2007','333','1',23,2639,3111,'Christophe Woittequand','2005WOIT01','France','a',3084,3163,3087,3498,2639,NULL,NULL),
('LyonOpen2007','333','1',24,2687,3265,'Georges Poinsot','2007POIN01','France','a',3387,3034,3373,3430,2687,NULL,NULL),
('LyonOpen2007','333','1',25,2934,3337,'Laetitia Lemoine','2007LEMO01','France','a',4006,3495,3563,2953,2934,NULL,NULL),
('LyonOpen2007','333','1',26,3062,3949,'Jean-Louis Mathieu','2006MATH01','France','a',4273,4303,3688,3062,3885,NULL,NULL),
('LyonOpen2007','333','1',27,3609,4430,'Guillaume Terrancle','2007TERR01','France','a',4497,3609,4541,4367,4425,NULL,NULL),
('LyonOpen2007','333','1',28,4416,4894,'Maria Oey','2007OEYM01','Indonesia','a',4700,5140,6938,4416,4841,NULL,'NR'),
('LyonOpen2007','333','1',29,3727,5327,'Olivier Pibarot','2007PIBA01','France','a',5443,3727,5929,5633,4906,NULL,NULL),
('LyonOpen2007','333','1',30,5484,8876,'Pierre-Baptiste Boccard','2007BOCC01','France','a',12321,8187,13066,5484,6119,NULL,NULL),
('LyonOpen2007','333','2',1,1141,1242,'Edouard Chambon','2004CHAM01','France','a',1433,1272,1200,1141,1253,NULL,NULL),
('LyonOpen2007','333','2',2,1168,1320,'Jean Pons','2004PONS01','France','a',1274,1432,1475,1255,1168,NULL,NULL),
('LyonOpen2007','333','2',3,1078,1374,'Joël van Noort','2004NOOR01','Netherlands','a',1469,1180,1078,1680,1473,'NR',NULL),
('LyonOpen2007','333','2',4,1240,1427,'Thibaut Jacquinot','2006JACQ01','France','a',1652,1363,1240,1584,1335,NULL,NULL),
('LyonOpen2007','333','2',5,1346,1624,'Rama Temmink','2006TEMM01','Netherlands','a',1802,1918,1504,1565,1346,NULL,NULL),
('LyonOpen2007','333','2',6,1453,1626,'Lars Vandenbergh','2003VAND01','Belgium','a',2152,1583,1453,1579,1717,NULL,NULL),
('LyonOpen2007','333','2',7,1522,1758,'Thomas Watiotienne','2007WATI01','France','a',1715,1815,1522,1744,1846,NULL,NULL),
('LyonOpen2007','333','2',8,1630,1764,'Gilles van den Peereboom','2005PEER01','Belgium','a',1762,1842,1887,1630,1689,NULL,NULL),
('LyonOpen2007','333','2',9,1466,1815,'Gilles Roux','2004ROUX01','France','a',2197,1585,1466,2903,1664,NULL,NULL),
('LyonOpen2007','333','2',10,1621,1853,'Guillaume Meunier','2004MEUN01','France','a',2859,1972,1807,1780,1621,NULL,NULL),
('LyonOpen2007','333','2',11,1650,1859,'Aurelien Souchet (高凡)','2006SOUC01','France','a',1936,1650,1831,2268,1811,NULL,NULL),
('LyonOpen2007','333','2',12,1645,1899,'Thomas Rouault','2004ROUA01','France','a',1913,1645,1869,2574,1916,NULL,NULL),
('LyonOpen2007','333','2',13,1655,1899,'Ton Dennenbroek','2003DENN01','Netherlands','a',2281,1793,1655,1857,2046,NULL,NULL),
('LyonOpen2007','333','2',14,1684,1947,'Stefan Huber','2007HUBE01','Austria','a',1957,1684,1812,2209,2072,NULL,'NR'),
('LyonOpen2007','333','2',15,1985,2124,'Frédérick Badie','2003BADI01','France','a',2571,2119,1985,2028,2225,NULL,NULL),
('LyonOpen2007','333','2',16,1696,2233,'Antoine Simon-Chautemps','2005SIMO01','France','a',2453,1799,2446,2582,1696,NULL,NULL),
('LyonOpen2007','333','2',17,2224,2640,'Etienne Amany','2007AMAN01','Cote d_Ivoire','a',2456,2853,3046,2610,2224,NULL,NULL),
('LyonOpen2007','333','2',18,2390,2735,'Marlène Desmaisons','2007DESM01','France','a',3234,3125,2439,2390,2640,NULL,NULL),
('LyonOpen2007','333','2',19,2506,2779,'Irène Mallordy','2007MALL01','France','a',2506,3165,-1,2595,2578,NULL,NULL),
('LyonOpen2007','333','2',20,2628,2916,'Arnaud van Galen','2006GALE01','Netherlands','a',3038,3190,2628,2710,2999,NULL,NULL),
('LyonOpen2007','333','2',21,1786,2933,'Clément Gallet','2004GALL02','France','a',2078,1943,1786,-1,4778,NULL,NULL),
('LyonOpen2007','333','f',1,1059,1271,'Jean Pons','2004PONS01','France','a',1452,1191,1171,1059,1884,NULL,NULL),
('LyonOpen2007','333','f',2,1205,1320,'Edouard Chambon','2004CHAM01','France','a',1271,1743,1309,1205,1379,NULL,NULL),
('LyonOpen2007','333','f',3,1197,1395,'Joël van Noort','2004NOOR01','Netherlands','a',1552,1246,1197,1606,1387,NULL,NULL),
('LyonOpen2007','333','f',4,1292,1424,'Thibaut Jacquinot','2006JACQ01','France','a',1292,1388,1573,1409,1476,NULL,NULL),
('LyonOpen2007','333','f',5,1383,1603,'Gilles Roux','2004ROUX01','France','a',1743,2249,1598,1469,1383,NULL,NULL),
('LyonOpen2007','333','f',6,1601,1615,'Rama Temmink','2006TEMM01','Netherlands','a',1601,1612,1612,1620,1776,NULL,NULL),
('LyonOpen2007','333','f',7,1444,1616,'Lars Vandenbergh','2003VAND01','Belgium','a',1741,1444,1725,1478,1646,NULL,NULL),
('LyonOpen2007','333','f',8,1575,1707,'Gilles van den Peereboom','2005PEER01','Belgium','a',1717,1691,1712,1831,1575,NULL,NULL),
('LyonOpen2007','333','f',9,1811,2131,'Guillaume Meunier','2004MEUN01','France','a',-1,2013,2294,2087,1811,NULL,NULL),
('LyonOpen2007','333oh','d',1,1858,2410,'Rama Temmink','2006TEMM01','Netherlands','a',2646,1858,2339,2724,2244,'NR','NR'),
('LyonOpen2007','333oh','d',2,1865,2445,'Gilles van den Peereboom','2005PEER01','Belgium','a',2605,1865,2176,3034,2555,'NR','NR'),
('LyonOpen2007','333oh','d',3,2269,2530,'Thibaut Jacquinot','2006JACQ01','France','a',2269,2484,2596,2511,-1,NULL,NULL),
('LyonOpen2007','333oh','d',4,2492,2770,'Edouard Chambon','2004CHAM01','France','a',2704,3136,2941,2492,2666,NULL,NULL),
('LyonOpen2007','333oh','d',5,2281,2894,'Aurelien Souchet (高凡)','2006SOUC01','France','a',3107,3008,2281,2566,3267,NULL,NULL),
('LyonOpen2007','333oh','d',6,2669,3082,'Joël van Noort','2004NOOR01','Netherlands','a',5954,2669,3211,2698,3336,NULL,NULL),
('LyonOpen2007','333oh','d',7,3303,4194,'Thomas Watiotienne','2007WATI01','France','a',5057,4653,3303,4056,3872,NULL,NULL),
('LyonOpen2007','333oh','d',8,3544,4239,'Clément Gallet','2004GALL02','France','a',4628,4281,3544,4638,3807,NULL,NULL),
('LyonOpen2007','333oh','d',9,4527,4764,'Arnaud van Galen','2006GALE01','Netherlands','a',4871,4527,4846,4575,5608,NULL,NULL),
('LyonOpen2007','333oh','d',10,4494,4938,'Gilles Roux','2004ROUX01','France','a',4505,4856,4494,5453,6080,NULL,NULL),
('LyonOpen2007','333oh','d',11,5388,5906,'Stefan Huber','2007HUBE01','Austria','a',6071,5616,6031,-1,5388,'NR','NR'),
('LyonOpen2007','333oh','d',12,5704,6795,'Ton Dennenbroek','2003DENN01','Netherlands','a',5714,7177,7836,5704,7493,NULL,NULL),
('LyonOpen2007','333oh','d',13,6084,0,'Antoine Simon-Chautemps','2005SIMO01','France','a',6388,6084,0,0,0,NULL,NULL),
('LyonOpen2007','333oh','d',14,6684,0,'Christophe Woittequand','2005WOIT01','France','a',8840,6684,0,0,0,NULL,NULL),
('LyonOpen2007','333oh','d',15,7259,0,'Etienne Amany','2007AMAN01','Cote d_Ivoire','a',7259,7733,0,0,0,'NR',NULL),
('LyonOpen2007','333oh','d',16,8467,0,'Irène Mallordy','2007MALL01','France','a',8467,8620,0,0,0,NULL,NULL),
('LyonOpen2007','333oh','d',17,13775,0,'Laetitia Lemoine','2007LEMO01','France','a',14941,13775,0,0,0,NULL,NULL),
('LyonOpen2007','333oh','f',1,2094,2186,'Rama Temmink','2006TEMM01','Netherlands','a',2108,2622,2094,2171,2278,NULL,'ER'),
('LyonOpen2007','333oh','f',2,2273,2507,'Edouard Chambon','2004CHAM01','France','a',2931,2833,2411,2273,2277,NULL,NULL),
('LyonOpen2007','333oh','f',3,2414,2581,'Gilles van den Peereboom','2005PEER01','Belgium','a',2556,2518,2414,2668,2675,NULL,NULL),
('LyonOpen2007','333oh','f',4,2457,2673,'Thibaut Jacquinot','2006JACQ01','France','a',2834,2593,2457,2593,-1,NULL,NULL),
('LyonOpen2007','333oh','f',5,2672,2817,'Aurelien Souchet (高凡)','2006SOUC01','France','a',2869,2858,2723,3377,2672,NULL,NULL),
('LyonOpen2007','333oh','f',6,3031,3334,'Joël van Noort','2004NOOR01','Netherlands','a',3147,3510,3806,3031,3344,NULL,NULL),
('LyonOpen2007','333oh','f',7,3618,4012,'Clément Gallet','2004GALL02','France','a',3618,4313,4015,3924,4096,NULL,NULL),
('LyonOpen2007','333oh','f',8,3571,4280,'Thomas Watiotienne','2007WATI01','France','a',4708,3571,3933,6071,4200,NULL,NULL),
('LyonOpen2007','444','c',1,6249,6611,'Jean Pons','2004PONS01','France','a',8134,6718,6512,6249,6602,NULL,NULL),
('LyonOpen2007','444','c',2,6696,7105,'Lars Vandenbergh','2003VAND01','Belgium','a',6696,6982,8692,6954,7380,NULL,NULL),
('LyonOpen2007','444','c',3,5819,7269,'Thibaut Jacquinot','2006JACQ01','France','a',8756,8022,5819,7139,6646,NULL,NULL),
('LyonOpen2007','444','c',4,6822,7605,'Frédérick Badie','2003BADI01','France','a',6891,10037,8402,7522,6822,NULL,NULL),
('LyonOpen2007','444','c',5,7667,8703,'Rama Temmink','2006TEMM01','Netherlands','a',9763,8318,8331,7667,9461,NULL,NULL),
('LyonOpen2007','444','c',6,7943,8726,'Clément Gallet','2004GALL02','France','a',9415,8331,7943,8698,9148,NULL,NULL),
('LyonOpen2007','444','c',7,8490,8833,'Gilles van den Peereboom','2005PEER01','Belgium','a',8657,10153,8490,8769,9074,NULL,NULL),
('LyonOpen2007','444','c',8,7131,9390,'Thomas Watiotienne','2007WATI01','France','a',9565,9451,9153,7131,9851,NULL,NULL),
('LyonOpen2007','444','c',9,8516,9537,'Aurelien Souchet (高凡)','2006SOUC01','France','a',10275,8516,9794,9547,9270,NULL,NULL),
('LyonOpen2007','444','c',10,8346,9641,'Gilles Roux','2004ROUX01','France','a',9186,9600,10136,8346,10651,NULL,NULL),
('LyonOpen2007','444','c',11,8890,10391,'Arnaud van Galen','2006GALE01','Netherlands','a',10870,10231,10946,8890,10072,NULL,NULL),
('LyonOpen2007','444','c',12,10171,11797,'Antoine Simon-Chautemps','2005SIMO01','France','a',11641,12742,10171,14002,11009,NULL,NULL),
('LyonOpen2007','444','c',13,12331,0,'Cyrille Cornu','2007CORN01','France','a',12331,14206,0,0,0,NULL,NULL),
('LyonOpen2007','444','c',14,13936,0,'Ton Dennenbroek','2003DENN01','Netherlands','a',13936,-1,0,0,0,NULL,NULL),
('LyonOpen2007','444','c',15,18544,0,'Jean-Louis Mathieu','2006MATH01','France','a',18544,18731,0,0,0,NULL,NULL),
('LyonOpen2007','444','c',16,25774,0,'Maria Oey','2007OEYM01','Indonesia','a',29040,25774,0,0,0,'NR',NULL),
('LyonOpen2007','555','c',1,11108,11731,'Frédérick Badie','2003BADI01','France','a',11509,-1,11108,12306,11377,NULL,NULL),
('LyonOpen2007','555','c',2,12051,12294,'Rama Temmink','2006TEMM01','Netherlands','a',12071,19266,12191,12619,12051,NULL,NULL),
('LyonOpen2007','555','c',3,12453,13688,'Lars Vandenbergh','2003VAND01','Belgium','a',12453,14571,13548,12946,14657,NULL,NULL),
('LyonOpen2007','555','c',4,13281,14193,'Joël van Noort','2004NOOR01','Netherlands','a',14182,14793,15652,13605,13281,NULL,NULL),
('LyonOpen2007','555','c',5,13795,16272,'Clément Gallet','2004GALL02','France','a',13795,17440,15838,15899,17079,NULL,NULL),
('LyonOpen2007','555','c',6,15528,16968,'Arnaud van Galen','2006GALE01','Netherlands','a',19713,17262,17042,15528,16599,NULL,NULL),
('LyonOpen2007','555','c',7,15560,18032,'Gilles van den Peereboom','2005PEER01','Belgium','a',17869,18258,19081,17970,15560,NULL,NULL),
('LyonOpen2007','555','c',8,18853,19691,'Aurelien Souchet (高凡)','2006SOUC01','France','a',21255,20426,19156,19490,18853,NULL,NULL),
('LyonOpen2007','555','c',9,27100,0,'Ton Dennenbroek','2003DENN01','Netherlands','a',31412,27100,0,0,0,NULL,NULL),
('LyonOpen2007','555','c',10,30156,0,'Gilles Roux','2004ROUX01','France','a',30156,-1,0,0,0,NULL,NULL),
('LyonOpen2007','333bf','f',1,16910,-1,'Clément Gallet','2004GALL02','France','3',-1,-1,16910,0,0,NULL,NULL),
('LyonOpen2007','333bf','f',2,21930,-1,'Joël van Noort','2004NOOR01','Netherlands','3',27568,-1,21930,0,0,NULL,NULL),
('LyonOpen2007','333bf','f',3,21969,-1,'Jean Pons','2004PONS01','France','3',-1,21969,-1,0,0,NULL,NULL);
/*!40000 ALTER TABLE `Results` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `RoundTypes`
--

DROP TABLE IF EXISTS `RoundTypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `RoundTypes` (
  `id` varchar(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `rank` int NOT NULL DEFAULT '0',
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `cellName` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `final` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RoundTypes`
--

LOCK TABLES `RoundTypes` WRITE;
/*!40000 ALTER TABLE `RoundTypes` DISABLE KEYS */;
INSERT INTO `RoundTypes` VALUES
('0',19,'Qualification round','Qualification round',0),
('1',29,'First round','First round',0),
('2',50,'Second round','Second round',0),
('3',79,'Semi Final','Semi Final',0),
('b',39,'B Final','B Final',0),
('c',90,'Final','Final',1),
('d',20,'First round','First round',0),
('e',59,'Second round','Second round',0),
('f',99,'Final','Final',1),
('g',70,'Semi Final','Semi Final',0),
('h',10,'Qualification round','Qualification round',0);
/*!40000 ALTER TABLE `RoundTypes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Scrambles`
--

DROP TABLE IF EXISTS `Scrambles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Scrambles` (
  `scrambleId` int unsigned NOT NULL DEFAULT '0',
  `competitionId` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `eventId` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  `roundTypeId` varchar(1) COLLATE utf8mb4_unicode_ci NOT NULL,
  `groupId` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isExtra` tinyint(1) NOT NULL,
  `scrambleNum` int NOT NULL,
  `scramble` text COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Scrambles`
--

LOCK TABLES `Scrambles` WRITE;
/*!40000 ALTER TABLE `Scrambles` DISABLE KEYS */;
INSERT INTO `Scrambles` VALUES
(1,'GaleriesDorianOpen2014','pyram','1','A',0,1,'U R\' L\' B U B\' R\' B\' L\' U L\' u\' r\' b\''),
(2,'GaleriesDorianOpen2014','pyram','1','A',0,2,'B\' L\' U\' B U\' L U\' R B\' R\' L\' u r'),
(3,'GaleriesDorianOpen2014','pyram','1','A',0,3,'R\' U R\' L\' B\' U L\' B\' R L\' U l\''),
(4,'GaleriesDorianOpen2014','pyram','1','A',0,4,'L R\' L U B R L R B R L\' u\' l'),
(5,'GaleriesDorianOpen2014','pyram','1','A',0,5,'B\' U R L\' R B L\' U\' B\' R\' U\' l\' r\''),
(6,'GaleriesDorianOpen2014','pyram','1','A',1,1,'L\' B\' U\' B\' R U R B\' U\' B L u r\' b\''),
(7,'GaleriesDorianOpen2014','pyram','1','A',1,2,'U\' B\' U\' R\' L U\' B U\' L\' U\' B\' r\' b\''),
(8,'GaleriesDorianOpen2014','pyram','1','B',0,1,'U\' R L U\' L U\' L\' R U\' B\' R u\' l b'),
(9,'GaleriesDorianOpen2014','pyram','1','B',0,2,'U R U\' B U B L U R\' U B\' u l r\' b\''),
(10,'GaleriesDorianOpen2014','pyram','1','B',0,3,'B\' L\' R\' B\' R L\' U\' R L B\' L\' u l\' b'),
(11,'GaleriesDorianOpen2014','pyram','1','B',0,4,'U\' B L B\' L R L\' R L B U\' u\' l b\''),
(12,'GaleriesDorianOpen2014','pyram','1','B',0,5,'B R\' U B U R L U\' R\' L\' U u\' l\' r\''),
(13,'GaleriesDorianOpen2014','pyram','1','B',1,1,'L B R\' B L R B L U\' L U\' u l\' r\' b'),
(14,'GaleriesDorianOpen2014','pyram','1','B',1,2,'U\' R L\' B\' U\' L R\' U B\' R\' L u l\' r b'),
(15,'GaleriesDorianOpen2014','pyram','f','A',0,1,'L\' B\' R L\' U B\' L\' R\' U R\' U\' u\' b\''),
(16,'GaleriesDorianOpen2014','pyram','f','A',0,2,'R\' L U\' L R\' U R U\' R\' L\' R\' u\' l\' r b\''),
(17,'GaleriesDorianOpen2014','pyram','f','A',0,3,'R\' L\' U\' L R\' B\' U\' L R\' L U u l b'),
(18,'GaleriesDorianOpen2014','pyram','f','A',0,4,'L R\' L\' R\' U\' R\' B\' U\' R\' U\' B u\' r'),
(19,'GaleriesDorianOpen2014','pyram','f','A',0,5,'U\' B\' L U L B\' R L B\' R\' L\' l r b'),
(20,'GaleriesDorianOpen2014','pyram','f','A',1,1,'L\' R\' U B\' R U L\' B\' U L\' B u l b\''),
(21,'GaleriesDorianOpen2014','pyram','f','A',1,2,'L U\' B\' R B U\' R\' L\' B L\' B l r'),
(22,'GaleriesDorianOpen2014','333bf','c','A',0,1,'B2 U\' L2 U F2 L2 D2 L2 U F2 L F2 L D U L\' D2 F\' U2 Fw'),
(23,'GaleriesDorianOpen2014','333bf','c','A',0,2,'D2 U L2 B2 R2 F2 R2 U2 R2 D\' R\' D B2 U B\' R B\' D Fw\' Uw\''),
(24,'GaleriesDorianOpen2014','333bf','c','A',0,3,'L2 D F2 D\' B2 L2 R2 U2 F2 D L\' U2 R2 B\' R F R2 D\' U F Rw\' Uw\''),
(25,'GaleriesDorianOpen2014','333bf','c','A',1,1,'U\' B2 U2 F2 L2 D\' F2 L2 B\' D2 B\' L\' F R D L\' B2 L2 B2 D\' Rw2 Uw'),
(26,'GaleriesDorianOpen2014','333bf','c','A',1,2,'U2 R2 U\' F2 D\' L2 F2 D L B2 F2 D\' L\' U2 L R F U2 B\' D2 Fw Uw2'),
(27,'GaleriesDorianOpen2014','333bf','c','B',0,1,'U2 L2 U\' L2 U2 B2 D L R\' B D\' F L2 D2 F\' L D F\' U\' Rw Uw2'),
(28,'GaleriesDorianOpen2014','333bf','c','B',0,2,'D U B2 L2 D R2 U\' L2 F L R D2 B\' D B2 R D2 F L\' Fw\' Uw\''),
(29,'GaleriesDorianOpen2014','333bf','c','B',0,3,'R2 F R2 F2 D2 U2 F\' U2 F\' L2 D\' L B2 F2 D F L F L2 R\' F2 Rw\''),
(30,'GaleriesDorianOpen2014','333bf','c','B',1,1,'L F2 U2 L D2 R2 B2 D2 B2 R\' B F\' R\' U\' F\' R F\' L\' F\' U Rw2 Uw\''),
(31,'GaleriesDorianOpen2014','333bf','c','B',1,2,'U2 B2 R2 F2 U\' L2 B2 U R2 U\' L D\' L2 F R B2 F\' R Fw Uw\''),
(32,'GaleriesDorianOpen2014','333','1','A',0,1,'B2 R2 F2 L\' U2 R D2 R D\' U2 F2 L\' R\' D L\' F L D L'),
(33,'GaleriesDorianOpen2014','333','1','A',0,2,'R U\' D\' R2 D\' R D B2 L B2 D\' F B2 D2 R2 F\' D2 F\' L2'),
(34,'GaleriesDorianOpen2014','333','1','A',0,3,'U R\' U F2 R U F B2 U R\' U2 F\' L2 B2 R2 U2 B U2 B U2'),
(35,'GaleriesDorianOpen2014','333','1','A',0,4,'B D2 F\' R2 D2 B U2 B\' L\' R\' D U\' L\' B R F\' R\' U R\''),
(36,'GaleriesDorianOpen2014','333','1','A',0,5,'D2 L2 R F2 D2 F2 R\' U2 L B\' U F R2 B\' D\' F2 R U2 L2 R\''),
(37,'GaleriesDorianOpen2014','333','1','A',1,1,'F2 L\' F2 R2 B2 F2 R D2 L\' U2 F U2 R D U L D\' B2 U2 F'),
(38,'GaleriesDorianOpen2014','333','1','A',1,2,'B2 D\' L2 U\' R2 B2 D\' B2 F2 L\' F D L2 F R\' D L\' B\' D F\''),
(39,'GaleriesDorianOpen2014','333','1','B',0,1,'F2 D2 B U2 R2 D2 R2 U2 F L\' F2 D\' B\' R\' D\' U R2 D\' L\''),
(40,'GaleriesDorianOpen2014','333','1','B',0,2,'R2 B2 D\' F2 U\' L2 F2 D2 L\' B2 R U\' B\' F2 L F2 L2 R2 U2 R\''),
(41,'GaleriesDorianOpen2014','333','1','B',0,3,'F\' B\' L\' F2 L\' U2 L B\' L\' U\' B\' D2 R B2 R2 L\' D2 L'),
(42,'GaleriesDorianOpen2014','333','1','B',0,4,'L U L\' D F2 L\' U2 D\' R L\' B L\' D2 L2 F2 D2 L2'),
(43,'GaleriesDorianOpen2014','333','1','B',0,5,'D L2 U2 B2 U L2 B2 D L2 U B R2 U\' B\' L\' D\' U\' F\' L\' B\' R\''),
(44,'GaleriesDorianOpen2014','333','1','B',1,1,'R U2 R2 F2 R\' F2 L D2 F2 D\' L\' R2 B2 R F U\' F2 U2'),
(45,'GaleriesDorianOpen2014','333','1','B',1,2,'R\' D2 R\' B2 R2 U2 B2 U2 F2 U\' B\' R\' D\' L\' B D F\' R\' D U'),
(46,'GaleriesDorianOpen2014','333','1','C',0,1,'D R2 D2 L2 D L2 R2 F2 D B2 L B U L2 D2 R B F2 D\' R\''),
(47,'GaleriesDorianOpen2014','333','1','C',0,2,'F2 U2 B2 R2 U2 B\' U2 R B D\' F\' R\' U\' R F2 D F\' D'),
(48,'GaleriesDorianOpen2014','333','1','C',0,3,'U F\' R\' F B2 R2 U B\' R2 L\' B\' L F2 R2 L B2 L D2 F2'),
(49,'GaleriesDorianOpen2014','333','1','C',0,4,'B R2 B2 L\' U\' L\' D R F L\' B L D2 B2 L2 B2 L D2 R2 B2'),
(50,'GaleriesDorianOpen2014','333','1','C',0,5,'U F2 U\' D\' R B U2 R U2 D B\' D F2 R2 U F2 R2 U'),
(51,'GaleriesDorianOpen2014','333','1','C',1,1,'R\' L\' B\' D\' R\' F\' B\' R2 B2 D2 R B2 U F2 U2 L2 B2 D\' F2 L2'),
(52,'GaleriesDorianOpen2014','333','1','C',1,2,'F2 U2 L2 R2 B2 L2 D B2 U2 B\' R\' F D2 U R\' B2 L U L F2'),
(53,'GaleriesDorianOpen2014','333','2','A',0,1,'B\' U\' B R2 U\' R2 U R D B\' D B2 D2 R2 F2 L F2 L2'),
(54,'GaleriesDorianOpen2014','333','2','A',0,2,'U2 F2 D2 R F2 L B2 U2 F U2 F\' R\' U B U\' B2 L F2 L2'),
(55,'GaleriesDorianOpen2014','333','2','A',0,3,'L2 U2 R2 B2 F2 D\' B2 U2 R2 U L2 R\' U\' B2 U\' L\' F2 L F\' R'),
(56,'GaleriesDorianOpen2014','333','2','A',0,4,'D2 U L2 D B2 U2 F2 R2 B D R F\' L\' B2 U\' R2 U2 L'),
(57,'GaleriesDorianOpen2014','333','2','A',0,5,'B2 U2 B2 U B2 U2 R2 F2 L2 D R F2 U L\' B\' D\' R D2 R F\''),
(58,'GaleriesDorianOpen2014','333','2','A',1,1,'R2 D\' L2 R2 F2 U\' L2 U2 B2 F U\' F U\' L F\' U2 L2 D\' B2 U2'),
(59,'GaleriesDorianOpen2014','333','2','A',1,2,'F U2 B2 F\' D2 U2 F\' R2 F2 L\' D R2 D F2 U\' R B\' F\' D\' L2'),
(60,'GaleriesDorianOpen2014','333','2','B',0,1,'F2 R2 B D2 B2 U2 F\' U F2 D R B2 L U2 F L F\' R\''),
(61,'GaleriesDorianOpen2014','333','2','B',0,2,'B2 L2 F2 L\' F2 R D2 B2 L2 D B\' L U R2 F R2 D R B\' F'),
(62,'GaleriesDorianOpen2014','333','2','B',0,3,'D2 L2 D\' L2 B2 F2 D B2 D L\' U2 R\' B2 D F\' D2 B U\' F\' D'),
(63,'GaleriesDorianOpen2014','333','2','B',0,4,'F2 B U2 R2 F\' R\' L\' F2 D\' R2 D2 F\' B\' D2 L2 F R2 B R2'),
(64,'GaleriesDorianOpen2014','333','2','B',0,5,'U2 L2 B R2 U2 B2 R2 F L2 U F L\' U2 R U F\' R2 D\' U R'),
(65,'GaleriesDorianOpen2014','333','2','B',1,1,'F2 U2 L\' R U2 L2 R D\' R\' U F R D2 B D L U\' R\''),
(66,'GaleriesDorianOpen2014','333','2','B',1,2,'U\' B\' D\' L2 U2 R\' L D\' R F D\' B2 L2 D F2 B2 D\' L2 F2 U2'),
(67,'GaleriesDorianOpen2014','333','f','A',0,1,'D2 L\' R\' B2 F2 R D2 R F L U\' L D F\' L B\' D R\' U2'),
(68,'GaleriesDorianOpen2014','333','f','A',0,2,'R2 B U2 R L B R\' U2 D\' L F\' D2 B2 D2 B2 L F2 R L B2'),
(69,'GaleriesDorianOpen2014','333','f','A',0,3,'B\' D2 F2 R2 F2 L2 F2 D L\' B L R\' B F2 R U2 F R'),
(70,'GaleriesDorianOpen2014','333','f','A',0,4,'U\' F2 U2 L2 R2 B2 U2 L U2 F\' D2 R D\' U2 F U\' L2 U2 F2'),
(71,'GaleriesDorianOpen2014','333','f','A',0,5,'L2 B\' U2 L2 B F2 L2 D\' U\' F2 R\' B D\' L B2 D F L'),
(72,'GaleriesDorianOpen2014','333','f','A',1,1,'R2 L U\' L U2 B R\' F2 L F L2 F L2 D2 B D2 R2'),
(73,'GaleriesDorianOpen2014','333','f','A',1,2,'D F2 U2 R2 U F2 U\' F2 U\' R\' D\' U2 B U2 R\' F2 D\' F2 U F'),
(74,'GaleriesDorianOpen2014','333oh','c','A',0,1,'D\' B2 R2 U\' B2 F2 D B D\' L2 U2 B R2 D R D L R\' U'),
(75,'GaleriesDorianOpen2014','333oh','c','A',0,2,'B2 L2 F\' R2 D2 B L2 F D\' L R\' D L D2 L D R\' U R'),
(76,'GaleriesDorianOpen2014','333oh','c','A',0,3,'D2 L F L2 B U\' D\' R F L\' U2 R2 U2 F2 L U2 D2 L\' U2'),
(77,'GaleriesDorianOpen2014','333oh','c','A',0,4,'B R2 B\' U2 R2 B\' R2 B2 R2 D L\' B R B2 D2 L F D L\' F'),
(78,'GaleriesDorianOpen2014','333oh','c','A',0,5,'U\' L2 U\' F2 D2 U2 L2 F\' U\' B\' D F2 D R U B2 L D2 U2'),
(79,'GaleriesDorianOpen2014','333oh','c','A',1,1,'F2 U L2 U2 B2 D F2 D R D2 B\' R F2 L B F2 D L\' D F2'),
(80,'GaleriesDorianOpen2014','333oh','c','A',1,2,'B F2 L2 F2 U2 L2 F\' L2 F\' L2 R U F\' L\' R2 U B2 L D2'),
(81,'GaleriesDorianOpen2014','333oh','c','B',0,1,'U L B\' R L\' F\' L2 B2 U\' F2 R2 L2 F2 L2 D2 F D2 F'),
(82,'GaleriesDorianOpen2014','333oh','c','B',0,2,'B2 L2 U F2 D2 R2 F2 L2 B R\' D U2 R\' U2 L2 D2 F U\''),
(83,'GaleriesDorianOpen2014','333oh','c','B',0,3,'F2 L2 F2 U L2 F2 U2 F2 R2 B D2 R2 F\' R2 F2 L\' U B\' D\' B\''),
(84,'GaleriesDorianOpen2014','333oh','c','B',0,4,'D2 L D2 R2 D2 R B2 F2 L\' D2 U B L2 F D R\' D L2 B2'),
(85,'GaleriesDorianOpen2014','333oh','c','B',0,5,'L2 U F2 L2 U2 R2 U2 R F2 U F2 U\' R B2 R2 F\' D2 L2'),
(86,'GaleriesDorianOpen2014','333oh','c','B',1,1,'D L2 F R2 B2 R2 L2 B U B R\' D2 L D2 L2 D2 B2 R2 F2'),
(87,'GaleriesDorianOpen2014','333oh','c','B',1,2,'F2 L2 D2 B\' L2 F2 U2 B L2 F R D\' L R2 B\' L2 D\' L2 R2 U'),
(88,'GaleriesDorianOpen2014','444','d','A',0,1,'U2 R\' D2 R U2 B2 L R D2 B\' L2 D L R F\' U2 F2 L\' R2 Uw2 F\' L2 Uw2 D Fw2 U\' F L2 R2 Uw2 Fw2 U2 L\' F Rw2 R2 U Fw Uw\' U\' L2 Fw U2 L2'),
(89,'GaleriesDorianOpen2014','444','d','A',0,2,'F B D\' L D\' F\' B\' R\' L2 B\' D\' B2 U\' F2 R2 U2 R2 F2 D L2 Rw2 Fw2 R Uw2 L2 F R\' B\' Uw2 R B\' F\' Uw F Rw2 B\' R\' F Fw\' Uw\' Rw\' R2 D\' Fw2'),
(90,'GaleriesDorianOpen2014','444','d','A',0,3,'R D L\' B R\' F B U\' L2 F\' R\' B2 L D2 F2 B2 L D2 R\' Rw2 Fw2 D\' L R Fw2 U\' Rw2 B2 U R D L\' Fw\' B2 U\' R2 B F Uw R2 L\' Fw\' D R\''),
(91,'GaleriesDorianOpen2014','444','d','A',0,4,'D2 L2 R2 B2 L2 U2 L2 U2 B\' D L U2 F2 D\' L U R\' F R2 F Rw2 F B2 L2 Fw2 U\' Fw2 U Rw2 B Uw2 U\' D Rw U F2 D F2 Fw B D2 R Fw Rw2 Uw R2'),
(92,'GaleriesDorianOpen2014','444','d','A',0,5,'L2 R2 D2 B\' R2 F2 L2 B\' R2 U2 F2 U\' L\' F2 R\' U2 F2 D U2 B D Uw2 L Fw2 Rw2 B2 Rw2 B2 U2 L Fw2 U\' Fw U\' L2 F\' Rw2 L Fw R Rw\' Fw D Fw\' F2'),
(93,'GaleriesDorianOpen2014','444','d','A',1,1,'L2 R2 F2 D2 R2 D\' B2 U R\' D\' R D\' R B R2 F\' U\' R U\' Fw2 Rw2 F\' Uw2 R2 U\' B U\' Rw2 B2 L2 B\' D Rw Fw2 D B Uw2 Fw\' Rw2 Uw\' Rw2 U\' L2 Fw2'),
(94,'GaleriesDorianOpen2014','444','d','A',1,2,'R U2 F2 R L2 D2 F2 R F2 R2 B2 D\' F L2 D\' B D\' F\' U\' R\' F Rw2 U\' D Rw2 L U\' Rw2 U2 R2 Uw2 U\' R Fw\' R2 D F2 Rw2 D\' L\' Uw\' Rw2 L2 Uw\' Fw\' Rw'),
(95,'GaleriesDorianOpen2014','444','d','B',0,1,'L2 D2 L\' U2 D2 F2 L F2 R2 F U\' B\' L\' U B\' F R2 B R\' D\' Uw2 Rw2 R\' Uw2 Fw2 L\' D L\' Uw2 U F2 D L2 Fw\' L2 Fw\' F R Uw\' L2 Fw Rw2 Fw\' R2 Uw'),
(96,'GaleriesDorianOpen2014','444','d','B',0,2,'B U2 L B D\' U\' F\' U\' F\' L\' B R\' B2 F2 R2 U2 R L2 B2 Rw2 U Fw2 Uw2 R Fw2 Rw2 F2 U D\' L\' U D\' Fw\' F2 L B2 D\' Uw Rw2 D\' R Fw2 R2'),
(97,'GaleriesDorianOpen2014','444','d','B',0,3,'R\' B2 L2 D2 B2 D2 R\' F2 L\' B U B\' U\' F B L2 U2 L U D Uw2 F R\' Uw2 R L2 Uw2 L U2 B2 R2 F\' Uw R D B U\' Fw2 L\' U\' Fw\' L Uw Rw\' R2 Uw'),
(98,'GaleriesDorianOpen2014','444','d','B',0,4,'L2 U\' R2 U\' F2 D\' R2 D\' L2 U B\' U2 L B\' L\' R D B R2 F\' Fw2 D\' Rw2 L\' Fw2 R L2 Uw2 R U R U\' Fw\' R B\' R\' U\' Rw F Uw\' R2 B F\' Uw\''),
(99,'GaleriesDorianOpen2014','444','d','B',0,5,'L2 D2 B U2 F L2 D2 F2 U2 B D\' L2 D\' L\' D U\' F B\' D\' F2 Fw2 Uw2 B\' R2 B\' Uw2 L Uw2 F2 L2 B F\' Rw2 Uw B Rw2 U2 F2 Fw\' U\' R\' Fw2 R\' Uw\' R2 Fw'),
(100,'GaleriesDorianOpen2014','444','d','B',1,1,'F2 L2 D\' L2 D L2 U F2 D2 L2 B U2 R U R2 D B R F\' Rw2 Fw2 L Fw2 B\' R\' L2 Uw2 F\' L2 R B R2 Uw B F\' L\' Fw\' D\' Rw U\' R L\' U2');
/*!40000 ALTER TABLE `Scrambles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `championships`
--

DROP TABLE IF EXISTS `championships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `championships` (
  `id` int NOT NULL DEFAULT '0',
  `competition_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `championship_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `championships`
--

LOCK TABLES `championships` WRITE;
/*!40000 ALTER TABLE `championships` DISABLE KEYS */;
INSERT INTO `championships` VALUES
(506,'ACA5thAnniversary2020','AZ'),
(328,'ACARO2016','HK'),
(170,'AFSwedishCubeOpen2016','SE'),
(326,'AlbanianOpen2018','AL'),
(414,'AlbanianOpen2019','AL'),
(296,'Andorra2017','AD'),
(487,'Andorra2019','AD'),
(765,'AndorranChampionship2024','AD'),
(923,'AndorranChampionship2025','AD'),
(426,'ArnoldClassicAfrica2019','ZA'),
(10,'AsianChampionship2010','_Asia'),
(11,'AsianChampionship2012','_Asia'),
(329,'AsianChampionship2012','HK'),
(12,'AsianChampionship2014','_Asia'),
(98,'AsianChampionship2014','JP'),
(13,'AsianChampionship2016','_Asia'),
(37,'AsianChampionship2016','greater_china'),
(354,'AsianChampionship2018','_Asia'),
(21,'AustralianNationals2010','AU'),
(22,'AustralianNationals2011','AU'),
(23,'AustralianNationals2012','AU'),
(24,'AustralianNationals2013','AU'),
(25,'AustralianNationals2014','AU'),
(26,'AustralianNationals2015','AU'),
(27,'AustralianNationals2016','AU'),
(28,'AustralianNationals2017','AU'),
(389,'AustralianNationals2018','AU'),
(489,'AustralianNationals2020','AU'),
(508,'AustralianNationals2021','AU'),
(538,'AustralianNationals2022','AU'),
(582,'AustralianNationals2023','AU'),
(721,'AustralianNationals2024','AU'),
(854,'AustralianNationals2025','AU'),
(509,'AustralianNationalsFMC2022','AU'),
(611,'AustralianNationalsFMC2023','AU'),
(754,'AustralianNationalsFMC2024','AU'),
(927,'AustralianNationalsFMC2025','AU'),
(555,'AzerbaijanNationals2022','AZ'),
(670,'AzerbaijanNationals2023','AZ'),
(324,'BanjaLukaOpen2017','BA'),
(350,'BanjaLukaOpen2018','BA'),
(770,'Barbados2025','BB'),
(968,'Barbados2026','BB'),
(442,'BelarusNationals2019','BY'),
(567,'BelgianNationals2022','BE'),
(675,'BelgianNationals2023','BE'),
(799,'BelgianNationals2024','BE'),
(951,'BelgianNationals2025','BE'),
(322,'BIHOpen2012','BA'),
(29,'BoliviaNationals2016','BO'),
(367,'BoliviaNationals2018','BO'),
(490,'BoliviaNationals2019','BO'),
(630,'BoliviaNationals2023','BO'),
(811,'BoliviaNationals2024','BO'),
(900,'BoliviaNationals2025','BO'),
(828,'BoliviaNationalsFMC2024','BO'),
(967,'BoliviaNationalsFMC2025','BO'),
(323,'BosniaandHerzegovinaOpen2016','BA'),
(30,'Brasileiro2013','BR'),
(34,'Brasileiro2016','BR'),
(35,'Brasileiro2017','BR'),
(341,'Brasileiro2018','BR'),
(32,'BrasileiroInverno2014','BR'),
(848,'BulgarianNationals2024','BG'),
(778,'CambodiaChampionship2024','KH'),
(473,'CambodiaCubingChampionship2019','KH'),
(438,'CampeonatoBrasileiro2019','BR'),
(665,'CampeonatoBrasileiro2023','BR'),
(736,'CampeonatoBrasileiro2024','BR'),
(866,'CampeonatoBrasileiro2025','BR'),
(666,'CampeonatoBrasileiroFMC2023','BR'),
(812,'CampeonatoBrasileiroFMC2024','BR'),
(881,'CampeonatoBrasileiroFMC2025','BR'),
(136,'CampeonatodePortugal2015','PT'),
(883,'CampeonatoNacional2012','CL'),
(884,'CampeonatoNacional2013','CL'),
(214,'CampeonatoNacionalPerubik2017','PE'),
(215,'CampeonatoSudamericano2013','_South America'),
(440,'CanadianChampionship2019','CA'),
(603,'CanadianChampionship2023','CA'),
(265,'CanadianOpen2007','CA'),
(264,'CanadianOpen2009','CA'),
(263,'CanadianOpen2011','CA'),
(262,'CanadianOpen2013','CA'),
(261,'CanadianOpen2015','CA'),
(260,'CanadianOpen2017','CA'),
(902,'CancelledCostaRicaNationals2025','CR'),
(521,'CancelledEstonianOpen2021','EE'),
(844,'ChampionnatCanadien2025','CA'),
(36,'ChinaChampionship2015','greater_china'),
(38,'ChinaChampionship2017','greater_china'),
(365,'ChinaChampionship2018','greater_china'),
(433,'ChinaChampionship2019','greater_china'),
(501,'ChinaChampionship2020','greater_china'),
(416,'ColombiaNationals2012','CO'),
(417,'ColombiaNationals2014','CO'),
(374,'ColombiaNationals2018','CO'),
(585,'ColombiaNationals2022','CO'),
(784,'ColombianNationals2024','CO'),
(936,'ColombianNationals2025','CO');
/*!40000 ALTER TABLE `championships` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eligible_country_iso2s_for_championship`
--

DROP TABLE IF EXISTS `eligible_country_iso2s_for_championship`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `eligible_country_iso2s_for_championship` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `championship_type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `eligible_country_iso2` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eligible_country_iso2s_for_championship`
--

LOCK TABLES `eligible_country_iso2s_for_championship` WRITE;
/*!40000 ALTER TABLE `eligible_country_iso2s_for_championship` DISABLE KEYS */;
INSERT INTO `eligible_country_iso2s_for_championship` VALUES
(1,'greater_china','CN'),
(2,'greater_china','HK'),
(3,'greater_china','MO'),
(4,'greater_china','TW');
/*!40000 ALTER TABLE `eligible_country_iso2s_for_championship` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schema_migrations`
--

DROP TABLE IF EXISTS `schema_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `schema_migrations` (
  `version` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schema_migrations`
--

LOCK TABLES `schema_migrations` WRITE;
/*!40000 ALTER TABLE `schema_migrations` DISABLE KEYS */;
INSERT INTO `schema_migrations` VALUES
('0');
/*!40000 ALTER TABLE `schema_migrations` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-24 16:30:35
