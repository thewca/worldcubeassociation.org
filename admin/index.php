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
            'Checks the finished persons in the Persons/Results tables.' );

  showPage( 'persons_finish_unfinished',
            'Lets you finish persons in Results by adding personId.' );

  showPage( 'check_rounds',
            'Checks for rounds.' );

  showPage( 'check_regional_record_markers',
            'Computes regional record markers, compares them to the stored ones.' );

  showPage( 'compute_auxiliary_data',
            'Computes auxiliary database data.' );

  showPage( 'update_statistics_page',
            'Updates the statistics page that normal users can see (youngest/oldest solvers, etc).',
            '../statistics.php?update8392=1' );

  showPage( 'export_public',
            'Exports the database to the public.' );

  echo "</dl><hr /><dl>\n";

  showPage( 'show_competition_details',
            "Shows competition details somewhat like they're shown on the competitions page, but for all competitions on one page for easier checking." );

  showPage( 'show_competition_infos',
            "Shows competition infos really like they're shown on the competitions page, but for all competitions on one page for easier checking." );

  showPage( 'validate_media',
            "Validates media that have been submitted." );

  showPage( 'add_local_names',
            "Add local names to persons." );

  showPage( 'persons_picture',
            "Validates pictures that have been submitted." );

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
