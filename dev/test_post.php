<?php

/**
hitting this file should create a drupal post.
Make sure $config['drupal']['path'] is set correctly in includes/_config.php.
This script assumes a specific content type exists in the Drupal database.
**/

$load_drupal_api = TRUE;
include("../includes/_framework.php");

$comp = new competitionData("NewAlbany2013", $wcadb_conn);
$post = new drupalPost("competition_announcement");

// Need to handle nonstandard result system dates specially.  (Results doesn't use a timestamp or anything standard.)
$competition_date = mktime(0, 0, 0, $comp->get("month"), $comp->get("day"), $comp->get("year"));

// Need to handle nonstandard country data specially. This field expects ISO2 value.
$competition_countryId = $comp->get("countryId");
$competition_country = $wcadb_conn->dbQuery("SELECT * FROM Countries WHERE id = '" . ($wcadb_conn->mysqlEscape($competition_countryId)) . "'");
if(count($competition_country) != 1 || !method_exists($competition_country[0], "iso2"))  {
    trigger_error("Warning: unique country not found!", E_USER_WARNING);
}
$competition_country_iso2 = countries_country_lookup($competition_country[0]->iso2, "iso2")->iso2;

// Need to handle website data specially (Non-atomic data contained here... need to separate website URL and title.
//      Default to WCA website if no valid URL is found.)
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

/** transfer data from competition data to Drupal Post **/
$date = date("Y-m-d\TH:i:s", $competition_date);
$post->value("title", $comp->get("name"))
     ->field("field_city_state", $comp->get("cityName"))
     ->field("field_competition_id", $comp->get("id"))
     ->field("field_date", Array("date" => date("M j Y", $competition_date)))
     ->field("field_date", Array("date" => date("M j Y", $competition_date)), 'value2')
     ->value("field_country", Array(($post->getNodeParam("language")) => $competition_country_iso2))
     ->field("field_website", ($comp->get("name")) . " Website", 'title')
     ->field("field_website", $url, 'url');

// print_r($post);
// $node = node_load(2404);
// print_r($node);

$error = $post->post()->postError();
print_r($error);
print "\nDone!";
