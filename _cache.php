<?

# Summary:
#
# This caches HTML page suffixes to prevent unnecessary recalculation,
# in order to reduce waste of resources (cpu time, database queries)
# and to improve delivery speed. When a certain page is first viewed,
# a suffix part can be stored in the cache directory for later reuse.
# The caches are deleted by the compute_auxiliary_data admin script.
#
# Details:
#
# To use the cache, a script calls the tryCache function, providing an
# identification of what gets cached. Let's say we're viewing "By Person"
# of the 2009 world championship:
#   http://www.worldcubeassociation.org/results/competition.php?byPerson=By+Person&competitionId=WC2009
# Before showing competition results, competition.php calls this:
#   tryCache( 'competition', $chosenCompetitionId, $chosenByPerson, $chosenAllResults, $chosenTop3, $chosenWinners );
# Which becomes:
#   tryCache( 'competition', 'WC2009', 1, 0, 0, 0 );
# The cacheId in this case is 'competition_WC2009_1_0_0_0'.
#
# If tryCache finds file "cache/$cacheId.cache", then this is delivered
# to the browser and we're exiting right there. Before the content, an
# 'rfc' comment helps us debugging, it stands for 'rest from cache'.
#
# If the file isn't found, tryCache starts buffering the output. When the
# page is completed, _footer.php calls finishCache which (if tryCache was called)
# stores the buffered output in the cache file and flushes it.
#
# Function deleteCaches deletes all such cache files. It is called by the
# compute_auxiliary_data.php admin script.
#
# Note: The reason we're only storing suffixes and not the whole HTML page
# is that we need to read the parameters for the cacheId before we can start
# caching. Also, I don't want to activate output buffering for all scripts,
# for example not for the statistics page which already has its own daily
# caching mechanism.

#----------------------------------------------------------------------
function tryCache ( ) {
#----------------------------------------------------------------------
  global $cacheFile;

  #--- Build whole cacheId
  $cacheIdParts = func_get_args();  # indirect because direct usage results in error before PHP 5.3 (see documentation)
  $cacheId = implode( '_', $cacheIdParts );

  #--- If cacheId is invalid or we're debugging, then don't use the cache
  if ( ! preg_match( '/^\w+$/', $cacheId ) || debug() ) {
    cacheLog( "invalid: $cacheId" );
    return;
  }

  #--- If it's in the cache already, then just deliver from cache and exit
  $cacheFile = "cache/$cacheId.cache";
  if ( file_exists( $cacheFile ) ) {
    echo "<!-- rfc -->\n";
    echo file_get_contents( $cacheFile );
    cacheLog( "use: $cacheId\t" . filesize($cacheFile) );
    exit;
  }

  #--- Otherwise, start recording for the cache
  ob_start();
}

#----------------------------------------------------------------------
function finishCache ( ) {
#----------------------------------------------------------------------
  global $cacheFile;

  #--- Store the cache if we're caching
  if ( $cacheFile ) {
    file_put_contents( $cacheFile, ob_get_contents() );
    cacheLog( "create: $cacheFile\t" . filesize($cacheFile) );
    ob_end_flush();
  }
}

#----------------------------------------------------------------------
function deleteCaches () {
#----------------------------------------------------------------------

  startTimer();
  cacheLog( "delete all" );
  $cacheFiles = glob( pathToRoot() . 'cache/*.cache' );
  echo "Deleting " . count($cacheFiles) . " cache files...<br />\n";

  foreach ( $cacheFiles as $cacheFile ) {
    #echo "deleting cache file [$cacheFile]<br />";
    unlink( $cacheFile );    
  }

  stopTimer( "deleteCaches" );
  echo "... done<br /><br />\n";
}

#----------------------------------------------------------------------
function cacheLog ( $message ) {
#----------------------------------------------------------------------

  file_put_contents( pathToRoot() . 'cache_log.txt', "$message\n", FILE_APPEND );
}

?>