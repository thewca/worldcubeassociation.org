<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

require( '../_header.php' );

showDescription();
showPages();

require( '../_footer.php' );

#----------------------------------------------------------------------
function showDescription () {
#----------------------------------------------------------------------

  echo "<p><b>Welcome to the WCA results administration!</b></p><hr />\n";
}

#----------------------------------------------------------------------
function showPages () {
#----------------------------------------------------------------------
  
  echo "<dl>\n";

  showPage( 'check_results',
            'Checks the Results table data.' );

  showPage( 'persons_check_finished',
            'Checks the finished persons in the Persons/Results tables. Does *NOT* affect the database unless you say so.' );

  showPage( 'persons_finish_unfinished',
            'Finishes persons in Results by adding personId. Does *NOT* affect the database unless you say so.' );

  showPage( 'check_regional_record_markers',
            'Computes regional record markers, compares them to the stored ones. *CAN* affect the database, namely if you tell it to.' );

#  showPage( 'check_persons',
#            'Checks the persons in the Persons/Results tables. Does *NOT* affect the database.' );

#  showPage( 'check_persons_inside_competition',
#            'Checks the persons for one competition, suggests fixes.' );

  showPage( 'compute_auxiliary_data',
            'Computes auxiliary database data. *DOES* affect the database.' );

  showPage( 'update_statistics_page',
            'Updates the statistics page that normal users can see (youngest/oldest solvers, etc).',
            '../statistics.php?update8392=1' );

  showPage( 'export_public',
            'Exports the database to the public.' );

#  showPage( 'compute_competition_events',
#            'Computes the eventSpecs field in the Competitions table for competitions without (TODO: WITHOUT???) results. *DOES* change the database.' );

#  showPage( 'persons_reset_demo',
#            'Somewhat resets the Caltech Winter 2007 results/persons' );

  echo "</dl><hr /><dl>\n";

  showPage( 'show_competition_details',
            "Shows competition details somewhat like they're shown on the competitions page, but for all competitions on one page for easier checking. Does *NOT* affect the database." );

  showPage( 'show_competition_infos',
            "Shows competition infos really like they're shown on the competitions page, but for all competitions on one page for easier checking. Does *NOT* affect the database." );

  showPage( 'validate_media',
            "Validates media that have been submitted. Does *NOT* affect the database unless you say so." );

  showPage( 'add_local_names',
            "Add local names to persons. *DOES* affect the database." );

  showPage( 'persons_picture',
            "Validates pictures that have been submitted. Does *NOT* affect the database." );

#  showPage( 'show_similar_names',
#            "Shows similar person names inside a competition you choose. Does *NOT* affect the database." );

  showPage( 'competitions_manage',
            "Manages competitions." );

  echo "</dl>\n";
}

#----------------------------------------------------------------------
function showPage ( $page, $text, $href="" ) {
#----------------------------------------------------------------------

  if ( ! $href )
    $href = "$page.php";
  echo "<dt><a href='$href'>$page</a></dt><dd>$text</dd>\n";
}

?>
