<pre><?php

analyze( '.' );

function analyze ( $dir ) {
  foreach ( scandir( $dir ) as $entry ) {
    if ( preg_match( '/^\\.$|^\\.\\.$|^zzz|\\.svn|^cache$|PHPExcel|jpgraph|^scrambles|^upload/', $entry ) )
      continue;
    $entry = "$dir/$entry";
    if ( is_dir( $entry ) )
      analyze( "$entry" );
    $size = is_file( $entry ) ? filesize( $entry ) : '';
    $hash = is_file( $entry ) ? sha1_file ( $entry ) : '';
    printf( "%9s %40s $entry\n", $size, $hash );
  }
}

?></pre>
