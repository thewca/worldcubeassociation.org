<?php

require_once( '_framework.php' );


getCompetitions();
showMap();

#----------------------------------------------------------------------
function getCompetitions () {
#----------------------------------------------------------------------
  global $chosenCompetitions;

  $chosenPersonId = getNormalParam( 'i' );

  $chosenCompetitions = dbQuery("
    SELECT 
      competition.*
    FROM
      Results result,
      Competitions competition
    WHERE 1
      AND result.personId='$chosenPersonId'
      AND competition.id = result.competitionId
    GROUP BY
      competition.id
    ORDER BY
      latitude, longitude, year, month, day");
}

#----------------------------------------------------------------------
function showMap () {
#----------------------------------------------------------------------
  global $chosenCompetitions;
 
?>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">

<head>
<title>World Cube Association - Official Results</title>
<script src="http://maps.google.com/maps?file=api&amp;v=2&amp;key=ABQIAAAAGU1lxRKjKY2msINWGWVpGBQbYy8YqffdsRVCI9c6jAKj6rG0nxSHbmoN9OgZk4LBxdzm88fVVb-Ncg" type="text/javascript"></script>
<script type="text/javascript">

var center;
var map;

function load() {
if (GBrowserIsCompatible()) {
map = new GMap2(document.getElementById("map"));
map.addControl(new GSmallMapControl());
map.addControl(new GMapTypeControl());
map.enableScrollWheelZoom();
<?
echo "map.setCenter(new GLatLng(30, 8), 2);";

for( $i = 1; $i < 10; $i++ ){
echo "var blueIcon$i = new GIcon(G_DEFAULT_ICON);\n";
echo "blueIcon$i.image = \"images/blue-dot$i.png\";\n";
echo "markerBlue$i = { icon:blueIcon$i };\n";

echo "var violetIcon$i = new GIcon(G_DEFAULT_ICON);\n";
echo "violetIcon$i.image = \"images/violet-dot$i.png\";\n";
echo "markerViolet$i = { icon:violetIcon$i };\n";
}

echo "var blueIconp = new GIcon(G_DEFAULT_ICON);\n";
echo "blueIconp.image = \"images/blue-dotp.png\";\n";
echo "markerBluep = { icon:blueIconp };\n";

echo "var violetIconp = new GIcon(G_DEFAULT_ICON);\n";
echo "violetIconp.image = \"images/violet-dotp.png\";\n";
echo "markerVioletp = { icon:violetIconp };\n";


$isFirst = true;
$countCompetitions = 0;
foreach( $chosenCompetitions as $competition ){
extract( $competition );

if( $latitude != 0 or $longitude != 0){
if( $isFirst ){
$previousLatitude = $latitude;
$previousLongitude = $longitude;
$isFirst = false;
}
if( $latitude != $previousLatitude || $longitude != $previousLongitude ){
$previousLatitude /= 1000000;
$previousLongitude /= 1000000;

$infosHtml .= $pastVenue;
echo "marker.bindInfoWindowHtml(\"$infosHtml\");\n";
echo "map.addOverlay(marker);\n";

$previousLatitude = $latitude;
$previousLongitude = $longitude;

$countCompetitions = 0;
$infosHtml = "";

}

$infosHtml .= "<b>" . competitionLink( $id, $cellName ) . "</b> (" . competitionDate( $competition ) . ", $year)<br/>";
$pastVenue = processLinks( htmlEntities( $venue , ENT_QUOTES ));

$latitude /= 1000000;
$longitude /= 1000000;
$countCompetitions++;
$cc = $countCompetitions;
if( $cc > 9 ) $cc = 'p';
echo "var point = new GLatLng($latitude, $longitude);\n";
if( date( 'Ymd' ) > (10000*$year + 100*$month + $day) )
echo "var marker = new GMarker(point, markerBlue$cc);\n";
else
echo "var marker = new GMarker(point, markerViolet$cc);\n";
}
}
$previousLatitude /= 1000000;
$previousLongitude /= 1000000;

$infosHtml .= $pastVenue;
echo "marker.bindInfoWindowHtml(\"$infosHtml\");\n";
echo "map.addOverlay(marker);\n";

?>
}
}

</script>
</head>
<body onload="load()" onunload="GUnload()">
<div id="map" style="width: 800px; height: 400px"></div>
</body>
</html>


<? } ?>
