<?php

$load_drupal_api = TRUE;
include("../_framework.php");

$conn = new wcaDBConn("localhost", "wca", "L@m3P@$$", "wca");
$comp = new competitionData("NewAlbany2013", $conn);
$post = new drupalPost("competition_announcement");

// Need to handle nonstandard result system dates specially.  (Results doesn't use a timestamp or anything standard.)
$competition_date = mktime(0, 0, 0, $comp->get("month"), $comp->get("day"), $comp->get("year"));

// Need to handle nonstandard country data specially.  (Results doesn't use ISO ids or anything standard.)  This field expects ISO2 value.
$competition_country = countries_country_lookup($comp->get("countryId"), "name")->iso2;

// Need to handle website data specially (Non-atomic data contained here. Need to process to separate website URL and title.  Default to WCA website if no valid URL is found.)
$url;
preg_match('/.*\[\{.*\}\{(.*)\}\].*/i', $comp->get("website"), $url);
if(isset($url[1]) && filter_var($url[1], FILTER_VALIDATE_URL))
{
    $url = $url[1];
}
else
{
    $url = "http://www.worldcubeassociation.org/";
}

/** transfer data to Drupal Post from competition data **/

$date = date("Y-m-d\TH:i:s", $competition_date);
$post->value("title", $comp->get("name"))
     ->field("field_city_state", $comp->get("cityName"))
     ->field("field_competition_id", $comp->get("id"))
     ->field("field_date", Array("date" => date("M j Y", $competition_date)))
     ->field("field_date", Array("date" => date("M j Y", $competition_date)), 'value2')
     ->field("field_country", $competition_country)
     ->field("field_website", $comp->get("name") . " Website", 'title')
     ->field("field_website", $url, 'url');

// print_r($post);
// $node = node_load(2404);
// print_r($node);

$error = $post->post()->postError();
print_r($error);
