<?

#----------------------------------------------------------------------
function cacheTableBegin ( $class, $columns ) {
#----------------------------------------------------------------------
  global $tableColumns;

  cache( "<table width='100%' border='0' cellpadding='0' cellspacing='0' class='$class'>\n\n");
  $tableColumns = $columns;
}

#----------------------------------------------------------------------
function cacheTableCaption ( $separate, $value ) {
#----------------------------------------------------------------------
  cacheTableCaptionNew( $separate, '', $value );
}

#----------------------------------------------------------------------
function cacheTableCaptionNew ( $separate, $ids, $value ) {
#----------------------------------------------------------------------
  global $tableOddRow, $tableColumns;

  $anchor = '&nbsp;';
  foreach( split( ' ', $ids ) as $id )
    if( $id )
      $anchor .= "<a name='$id'>&nbsp;</a>";

  $tableOddRow = false;
  cacheTableRowFull( $anchor );
  if( ! $value ) $value = '&nbsp;';
  cache( "<tr>");
  cache( "<td class='caption' colspan='$tableColumns'>$value</td>");
  cache( "</tr>\n\n");
  if( $separate )
    cacheTableRowBlank();
}

#----------------------------------------------------------------------
function cacheTableHeader ( $values, $attributes ) {
#----------------------------------------------------------------------
  global $tableAttributes, $tableColumns, $tableOddRow;
  $tableAttributes = $attributes;

  # debug
  $tc = count( $values );
  assertFoo( $tc == $tableColumns, "Wrong number of table header cells ($tc instead of $tableColumns)" );

  cache( "<tr>\n");
  foreach( $values as $value ){
    if( ! $value ) $value = '&nbsp;';
    $value = preg_replace( '/ /', '&nbsp;', $value );
    $attr = $attributes[0+$columnCtr++];
    if( $attr ) $attr = " $attr";
    cache( "<th $attr>$value</th>\n");
  }
  cache( "</tr>\n\n");
  $tableOddRow = false;
}

#----------------------------------------------------------------------
function cacheTableRow ( $values ) {
#----------------------------------------------------------------------
  cacheTableRowStyled( '', $values );
}

#----------------------------------------------------------------------
function cacheTableRowStyled ( $style, $values ) {
#----------------------------------------------------------------------
  global $tableOddRow, $tableAttributes, $tableColumns;

  # debug
  $tc = count( $values );
  assertFoo( $tc == $tableColumns, "Wrong number of table header cells ($tc instead of $tableColumns)" );

  if( $style )
    $style = " style='$style'";

  cache( "<tr$style" . (($tableOddRow = !$tableOddRow) ? "" : " class='e'" ) . ">");
  foreach( $values as $value ){
    if( ! $value ) $value = '&nbsp;';
    $attr = $tableAttributes[0+$columnCtr++];
    if( $attr ) $attr = " $attr";
    cache( "<td$attr>$value</td>");
  }
  cache( "</tr>\n");
}

#----------------------------------------------------------------------
function cacheTableRowEmpty () {
#----------------------------------------------------------------------
  global $tableOddRow, $tableColumns;

  cache( "<tr" . (($tableOddRow = !$tableOddRow) ? "" : " class='e'" ) . ">");
  cache( "<td colspan='$tableColumns'>&nbsp;</td>");
  cache( "</tr>\n\n");
}

#----------------------------------------------------------------------
function cacheTableRowFull ( $content ) {
#----------------------------------------------------------------------
  global $tableOddRow, $tableColumns;

  cache( "<tr" . (($tableOddRow = !$tableOddRow) ? "" : " class='e'" ) . ">");
  cache( "<td colspan='$tableColumns'>$content</td>");
  cache( "</tr>\n\n");
}

#----------------------------------------------------------------------
function cacheTableRowBlank () {
#----------------------------------------------------------------------
  global $tableColumns;

  cache( "<tr><td colspan='$tableColumns'>&nbsp;</td></tr>\n\n");
}

#----------------------------------------------------------------------
function cacheTableEnd () {
#----------------------------------------------------------------------

  cache( "</table>\n\n");
}

?>
