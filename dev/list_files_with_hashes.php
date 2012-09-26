<html><body><pre>
<?php

#  ^cache|^scrambles|^upload|^PHPExcel|^jpgraph|^statistics\\.(cached|log)|^speedcubing2.site.aplus.net/', $child )
#  ^cache|^scrambles|^upload|^PHPExcel|^jpgraph|^statistics\\.(cached|log)|^speedcubing2.site.aplus.net/', $child )

#--- Preparation: check whether we're local, and specify what to ignore
$isLocal = $_SERVER['SERVER_NAME'] == 'localhost';
$ignorePattern = preg_replace( '/\\./', '\\.', preg_replace( '/\\s*\n\\s*/', '|', trim( '
  ^./admin/.htaccess$
  ^./admin/.htpasswd$
  ^./admin/export/serial.txt$
  ^./cache$
  ^./competitions$
  ^./d.php$
  ^./dev/.htaccess$
  ^./dev/test_files$
  ^./euro2012.php$
  ^./generated$
  ^./includes/_config.php$
  ^./misc/WCA_export\\d+_\\d+.(sql|tsv).zip$
  ^./misc/age_vs_speed(.html)?$
  ^./misc/export.html$
  ^./misc/statistics_fail.php$
  ^./misc/wc2009.php$
  ^./results.xls$
  ^./thirdparty$
  ^./upload$
  ^./WC2011.php$
')));
echo "[$ignorePattern]\n";

#--- Run the analysis
analyze( '.' );

#--- Report the results
echo "\n[CHECKED]\n{$checked}[/CHECKED]\n";
echo "\n[IGNORED]\n{$ignored}[/IGNORED]\n";

#----------------------------------------------------------------------
function analyze ( $path ) {
#----------------------------------------------------------------------

  #--- Process all child entries in the directory
  foreach( scandir( $path ) as $child ){

    #--- Totally ignore the . and .. navigation directories
    if( preg_match( '/^\\.$|^\\.\\.$/', $child ) )
      continue;

    #--- Ignore local .svn, .git and zzz*
    if( $GLOBALS['isLocal']  &&  preg_match( '/^\\.svn|^\\.git|^zzz/', $child ))
      continue;

    $child = "$path/$child";
    $ignore = preg_match( '{'.$GLOBALS['ignorePattern'].'}', $child );

    $size = $hash = '';
    if ( is_file( $child ) ) {
      $data = file_get_contents( $child );
      if ( preg_match( '/\\.(php|css|txt|htaccess|template|md)$/', $child ) )
        $data = str_replace( "\r\n", "\n", $data );
      $size = strlen( $data );
      $hash = substr( sha1( $data ), 30 );
    }
    $GLOBALS[$ignore?'ignored':'checked'] .= sprintf( "%8s %10s $child\n", $size, $hash );
    if( is_dir( $child ) && !$ignore )
      analyze( $child );
  }
}

?>
</pre></body></html>
