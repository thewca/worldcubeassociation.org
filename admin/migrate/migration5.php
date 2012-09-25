<?php

# - Set ResultsStatus['migration'] to '5'
#
# - Table "Competitions":
#     - Add latitude and longitude.
# - Table "Countries":
#     - Add latitude, longitude and zoom.
# - Table "Continents":
#     - Add latitude, longitude and zoom.



#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

require( '../../includes/_header.php' );
require( '../_helpers.php' );

migrate();

require( '../../includes/_footer.php' );

#----------------------------------------------------------------------
function migrate () {
#----------------------------------------------------------------------

  #--- Leave if we've done this migration already.
  if( ! databaseTableExists( 'ResultsStatus' )){
    noticeBox( false, "You need to apply migation 1 first." );
    return;
  }
  
  #--- Leave if we are already up-to-date
  $number = dbQuery( "
              SELECT value FROM  ResultsStatus
              WHERE  id = 'migration'
  ");
  $number = $number[0]['value'];
  if ($number != '4'){
    noticeBox( false,  "Wrong version number : " . $number . ". Must be 4");
    return;
  }


  #--- ResultsStatus table: Update migration number.
  reportAction( "ResultsStatus", "Set migration number to 5" );
  dbCommand( "
    UPDATE   ResultsStatus
    SET    value = '5'
    WHERE  id = 'migration'
  ");


  #--- Apply the migration changes.
  alterTableCompetitions();
  alterTableCountries();
  alterTableContinents();
    
  #--- Yippie, we did it!
  noticeBox( true, "Migration completed." );
}

#----------------------------------------------------------------------
function reportAction ( $tableName, $message ) {
#----------------------------------------------------------------------

  echoAndFlush( "<p><b>$tableName: </b>$message...</p>" );
}

#----------------------------------------------------------------------
function alterTableCompetitions () {
#----------------------------------------------------------------------

  #--- Alter the field set.
  reportAction( "Competitions", "Alter field set" );
  dbCommand("
    ALTER TABLE Competitions
      ADD    COLUMN `latitude`  INTEGER NOT NULL DEFAULT 0,
      ADD    COLUMN `longitude` INTEGER NOT NULL DEFAULT 0
  ");
  
  }

#----------------------------------------------------------------------
function alterTableContinents () {
#----------------------------------------------------------------------

  reportAction( "Continents", "Alter field set" );
  dbCommand("
    ALTER TABLE Continents
      ADD    COLUMN `latitude`  INTEGER NOT NULL DEFAULT 0,
      ADD    COLUMN `longitude` INTEGER NOT NULL DEFAULT 0,
      ADD    COLUMN `zoom`      TINYINT NOT NULL DEFAULT 0
  ");

  reportAction( "Continents", "Fill" );

  dbCommand( "
    UPDATE Continents
    SET    latitude='213671',
           longitude='16984850',
           zoom='3'
    WHERE  id = '_Africa'
  ");
  
  dbCommand( "
    UPDATE Continents
    SET    latitude='34364439',
           longitude='108330700',
           zoom='2'
    WHERE  id = '_Asia'
  ");
  
  dbCommand( "
    UPDATE Continents
    SET    latitude='-25274398',
           longitude='133775136',
           zoom='3'
    WHERE  id = '_Australia'
  ");
  
  dbCommand( "
    UPDATE Continents
    SET    latitude='58299984',
           longitude='23049300',
           zoom='3'
    WHERE  id = '_Europe'
  ");
  
  dbCommand( "
    UPDATE Continents
    SET    latitude='45486546',
           longitude='-93449700',
           zoom='3'
    WHERE  id = '_North America'
  ");
  
  dbCommand( "
    UPDATE Continents
    SET    latitude='-21735104',
           longitude='-63281250',
           zoom='3'
    WHERE  id = '_South America'
  ");

}

#----------------------------------------------------------------------
function alterTableCountries () {
#----------------------------------------------------------------------

  reportAction( "Countries", "Alter field set" );
  dbCommand("
    ALTER TABLE Countries
      ADD    COLUMN `latitude`  INTEGER NOT NULL DEFAULT 0,
      ADD    COLUMN `longitude` INTEGER NOT NULL DEFAULT 0,
      ADD    COLUMN `zoom`      TINYINT NOT NULL DEFAULT 0
  ");

  reportAction( "Countries", "Fill" );

  dbCommand( "
    UPDATE Countries
    SET    latitude='50503887',
           longitude='4469936',
           zoom='7'
    WHERE  id = 'Belgium'
  ");

  dbCommand( "
    UPDATE Countries
    SET    latitude='-14235004',
           longitude='-51925280',
           zoom='4'
    WHERE  id = 'Brazil'
  ");

  dbCommand( "
    UPDATE Countries
    SET    latitude='56130366',
           longitude='-106346771',
           zoom='3'
    WHERE  id = 'Canada'
  ");

  dbCommand( "
    UPDATE Countries
    SET    latitude='35861660',
           longitude='104195397',
           zoom='4'
    WHERE  id = 'China'
  ");

  dbCommand( "
    UPDATE Countries
    SET    latitude='49817492',
           longitude='15472962',
           zoom='7'
    WHERE  id = 'Czech Republic'
  ");

  dbCommand( "
    UPDATE Countries
    SET    latitude='56263920',
           longitude='9501785',
           zoom='6'
    WHERE  id = 'Denmark'
  ");

  dbCommand( "
    UPDATE Countries
    SET    latitude='61924110',
           longitude='25748151',
           zoom='5'
    WHERE  id = 'Finland'
  ");

  dbCommand( "
    UPDATE Countries
    SET    latitude='46227638',
           longitude='2213749',
           zoom='5'
    WHERE  id = 'France'
  ");

  dbCommand( "
    UPDATE Countries
    SET    latitude='51165691',
           longitude='10451526',
           zoom='5'
    WHERE  id = 'Germany'
  ");

  dbCommand( "
    UPDATE Countries
    SET    latitude='22396428',
           longitude='114109497',
           zoom='10'
    WHERE  id = 'Hong Kong'
  ");

  dbCommand( "
    UPDATE Countries
    SET    latitude='47162494',
           longitude='19503304',
           zoom='7'
    WHERE  id = 'Hungary'
  ");

  dbCommand( "
    UPDATE Countries
    SET    latitude='20593684',
           longitude='78962880',
           zoom='4'
    WHERE  id = 'India'
  ");

  dbCommand( "
    UPDATE Countries
    SET    latitude='41871940',
           longitude='12567380',
           zoom='5'
    WHERE  id = 'Italy'
  ");

  dbCommand( "
    UPDATE Countries
    SET    latitude='36204824',
           longitude='138252924',
           zoom='5'
    WHERE  id = 'Japan'
  ");

  dbCommand( "
    UPDATE Countries
    SET    latitude='35907757',
           longitude='127766922',
           zoom='6'
    WHERE  id = 'Korea'
  ");

  dbCommand( "
    UPDATE Countries
    SET    latitude='23634501',
           longitude='-102552784',
           zoom='5'
    WHERE  id = 'Mexico'
  ");

  dbCommand( "
    UPDATE Countries
    SET    latitude='52132633',
           longitude='5291266',
           zoom='7'
    WHERE  id = 'Netherlands'
  ");

  dbCommand( "
    UPDATE Countries
    SET    latitude='65146114',
           longitude='13183593',
           zoom='4'
    WHERE  id = 'Norway'
  ");

  dbCommand( "
    UPDATE Countries
    SET    latitude='12879721',
           longitude='121774017',
           zoom='5'
    WHERE  id = 'Philippines'
  ");

  dbCommand( "
    UPDATE Countries
    SET    latitude='51919438',
           longitude='19145136',
           zoom='6'
    WHERE  id = 'Poland'
  ");

  dbCommand( "
    UPDATE Countries
    SET    latitude='39399872',
           longitude='-8224454',
           zoom='6'
    WHERE  id = 'Portugal'
  ");

  dbCommand( "
    UPDATE Countries
    SET    latitude='40463667',
           longitude='-3749220',
           zoom='6'
    WHERE  id = 'Spain'
  ");

  dbCommand( "
    UPDATE Countries
    SET    latitude='60128161',
           longitude='18643501',
           zoom='4'
    WHERE  id = 'Sweden'
  ");

  dbCommand( "
    UPDATE Countries
    SET    latitude='46818188',
           longitude='8227512',
           zoom='7'
    WHERE  id = 'Switzerland'
  ");

  dbCommand( "
    UPDATE Countries
    SET    latitude='23697810',
           longitude='120960515',
           zoom='7'
    WHERE  id = 'Taiwan'
  ");

  dbCommand( "
    UPDATE Countries
    SET    latitude='55378051',
           longitude='-3435973',
           zoom='5'
    WHERE  id = 'United Kingdom'
  ");

  dbCommand( "
    UPDATE Countries
    SET    latitude='37090240',
           longitude='-95712891',
           zoom='4'
    WHERE  id = 'USA'
  ");

}
?>
