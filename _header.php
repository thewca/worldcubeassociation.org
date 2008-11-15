<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">

<? require_once( '_framework.php' ); ?>
<? $standAlone = getBooleanParam( 'standAlone' ); ?>

<head>
<title>World Cube Association - Official Results</title>
<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" />
<meta name="author" content="Stefan Pochmann, Josef Jelinek" />
<meta name="description" content="Official World Cube Association Competition Results" />
<meta name="keywords" content="rubik's cube,puzzles,competition,official results,statistics,WCA" />
<link rel="shortcut icon" href="images/wca.ico" />
<link rel="stylesheet" type="text/css" href="<?= pathToRoot() ?>style/general.css" />
<link rel="stylesheet" type="text/css" href="<?= pathToRoot() ?>style/pageMenu.css" />
<link rel="stylesheet" type="text/css" href="<?= pathToRoot() ?>style/tables.css" />
<link rel="stylesheet" type="text/css" href="<?= pathToRoot() ?>style/links.css" />

<? if( $mapHeaderRequire ){ ?>
  <script src="http://maps.google.com/maps?file=api&amp;v=2&amp;key=ABQIAAAAGU1lxRKjKY2msINWGWVpGBQbYy8YqffdsRVCI9c6jAKj6rG0nxSHbmoN9OgZk4LBxdzm88fVVb-Ncg" type="text/javascript"></script>
  <script type="text/javascript">

    var center;
    var map;

    function load() {
      if (GBrowserIsCompatible()) {
        map = new GMap2(document.getElementById("map"));
        map.addControl(new GSmallMapControl());
        map.addControl(new GMapTypeControl());
<?
if( $chosenRegionId && $chosenRegionId != 'World' ){ 

  $continent = dbQuery("SELECT * FROM Continents WHERE id='$chosenRegionId' ");
  
  if( count( $continent ))
    $coords = $continent[0];
  else {
    $country = dbQuery("SELECT * FROM Countries WHERE id='$chosenRegionId' ");
    if( count( $country ))
      $coords = $country[0];
    //else ERROR !

  }
  $coords['latitude'] /= 1000000;
  $coords['longitude'] /= 1000000;
  echo "map.setCenter(new GLatLng($coords[latitude], $coords[longitude]), $coords[zoom]);";
}

else
  echo "map.setCenter(new GLatLng(20, 8), 2);";

?>
        var blueIcon = new GIcon(G_DEFAULT_ICON);
        blueIcon.image = "images/blue-dot.png";
        markerBlue = { icon:blueIcon };

		  var violetIcon = new GIcon(G_DEFAULT_ICON);
        violetIcon.image = "images/violet-dot.png";
        markerViolet = { icon:violetIcon };

<?
  foreach( $chosenCompetitions as $competition ){
    extract( $competition );

    if( $latitude != 0 or $longitude != 0){
      $latitude  /= 1000000;
      $longitude /= 1000000;
      echo "var point = new GLatLng($latitude, $longitude);\n";
      if( date( 'Ymd' ) > (10000*$year + 100*$month + $day) )
        echo "var marker = new GMarker(point, markerBlue);\n";
      else
        echo "var marker = new GMarker(point, markerViolet);\n";

      $infosHtml = "<b>" . competitionLink( $id, $cellName ) . "</b><br/>";
      $infosHtml .= "<b>Date</b> : " . competitionDate( $competition ) . ", $year<br/>";
      //$venue = preg_replace( '/ \[ \{ ([^]]*) \} \{ ([^]]*) \} \] /x', '$1', $venue );
      //$infosHtml .= "<b>Venue</b> : $venue";
      $infosHtml .= "<b>Venue</b> : " . processLinks( htmlEntities( $venue , ENT_QUOTES ));
      echo "marker.bindInfoWindowHtml(\"$infosHtml\");\n";
      echo "map.addOverlay(marker);\n";
    }
  }

?>
      }
    }

    </script>
<? } ?>
</head>
<? if( $mapHeaderRequire ){ ?> <body onload="load()" onunload="GUnload()">
<? } else { ?> <body> <? } ?>
<? if( ! $standAlone ){ ?>
<div id="main">
<div id="content">

<?
  $sections = array(
    array( 'Home',         '../index'     ),
    array( 'Results',      'index'        ),
    array( 'Events',       'events'       ),
    array( 'Regions',      'regions'      ),
    array( 'Competitions', 'competitions' ),
    array( 'Persons',      'persons'      ),
    array( 'Multimedia',   'media'        ),
    array( 'Statistics',   'statistics'   )
  );
?>

<div id="pageMenuFrame">
  <div id="pageMenu">
    <table summary="This table gives other relevant links" cellspacing="0" cellpadding="0"><tr>
<? foreach( $sections as $section ){
    $name   = $section[0];
    $id     = $section[1];
    $active = ($id == $currentSection) ? 'id="activePage"' : ''; ?>
<td><div class="item"><a href="<?= pathToRoot() . $id ?>.php" <?= $active ?>><?= $name ?></a></div></td>
<? } ?>
    </tr></table>
  </div>
</div>

<div id='header'>World Cube Association<br />Official Results</div>
<? } ?>

<? startTimer() ?>
