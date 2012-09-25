<?

#----------------------------------------------------------------------
function tableBegin ( $class, $columns ) {
#----------------------------------------------------------------------
  global $tableColumns;

  echo "<table width='100%' border='0' cellpadding='0' cellspacing='0' class='$class'>\n\n";
  $tableColumns = $columns;
}

#----------------------------------------------------------------------
function tableCaption ( $separate, $value ) {
#----------------------------------------------------------------------
  tableCaptionNew( $separate, '', $value );
}

#----------------------------------------------------------------------
function tableCaptionNew ( $separate, $ids, $value ) {
#----------------------------------------------------------------------
  global $tableOddRow, $tableColumns;

  $anchor = '&nbsp;';
  foreach( explode( ' ', $ids ) as $id )
    if( $id )
      $anchor .= "<a name='$id'>&nbsp;</a>";

  $tableOddRow = false;
  tableRowFull( $anchor );
  if( ! $value ) $value = '&nbsp;';
  echo "<tr>";
  echo "<td class='caption' colspan='$tableColumns'>$value</td>";
  echo "</tr>\n\n";
  if( $separate )
    tableRowBlank();
}

#----------------------------------------------------------------------
function tableHeader ( $values, $attributes ) {
#----------------------------------------------------------------------
  global $tableAttributes, $tableColumns, $tableOddRow;
  $tableAttributes = $attributes;

  # debug
  $tc = count( $values );
  assertFoo( $tc == $tableColumns, "Wrong number of table header cells ($tc instead of $tableColumns)" );

  echo "<tr>\n";
  $columnCtr = 0;
  foreach( $values as $value ){
    if( ! $value ) $value = '&nbsp;';
    //$value = preg_replace( '/ /', '&nbsp;', $value );
    $attr = "";
    if( isset( $attributes[$columnCtr] ))
      $attr = " " . $attributes[$columnCtr];
    echo "<th$attr>$value</th>\n";
    $columnCtr++;
  }
  echo "</tr>\n\n";
  $tableOddRow = false;
}

#----------------------------------------------------------------------
function tableRow ( $values ) {
#----------------------------------------------------------------------
  tableRowStyled( '', $values );
}

#----------------------------------------------------------------------
function tableRowStyled ( $style, $values ) {
#----------------------------------------------------------------------
  global $tableOddRow, $tableAttributes, $tableColumns;

  # debug
  $tc = count( $values );
  assertFoo( $tc == $tableColumns, "Wrong number of table header cells ($tc instead of $tableColumns)" );

  if( $style )
    $style = " style='$style'";

  echo "<tr$style" . (($tableOddRow = !$tableOddRow) ? "" : " class='e'" ) . ">";
  $columnCtr = 0;
  foreach( $values as $value ){
    if( ! $value ) $value = '&nbsp;';
    $attr = "";
    if( isset( $tableAttributes[$columnCtr] ))
      $attr = " ".$tableAttributes[$columnCtr];
    echo "<td$attr>$value</td>";
    $columnCtr++;
  }
  echo "</tr>\n";
}

#----------------------------------------------------------------------
function tableRowEmpty () {
#----------------------------------------------------------------------
  global $tableOddRow, $tableColumns;

  echo "<tr" . (($tableOddRow = !$tableOddRow) ? "" : " class='e'" ) . ">";
  echo "<td colspan='$tableColumns'>&nbsp;</td>";
  echo "</tr>\n\n";
}

#----------------------------------------------------------------------
function tableRowFull ( $content ) {
#----------------------------------------------------------------------
  global $tableOddRow, $tableColumns;

  echo "<tr" . (($tableOddRow = !$tableOddRow) ? "" : " class='e'" ) . ">";
  echo "<td colspan='$tableColumns'>$content</td>";
  echo "</tr>\n\n";
}

#----------------------------------------------------------------------
function tableRowBlank () {
#----------------------------------------------------------------------
  global $tableColumns;

  echo "<tr><td colspan='$tableColumns'>&nbsp;</td></tr>\n\n";
}

#----------------------------------------------------------------------
function tableEnd () {
#----------------------------------------------------------------------

  echo "</table>\n\n";
}

?>
