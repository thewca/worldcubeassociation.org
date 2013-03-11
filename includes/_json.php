<?

#----------------------------------------------------------------------
function wca_decode_json ( $json ) {
#----------------------------------------------------------------------

  $data = json_decode( $json, true );
  if (json_last_error() == JSON_ERROR_NONE)
    return array($data, false);
  
  switch (json_last_error()) {
    case JSON_ERROR_DEPTH:          return array(false, 'Maximum stack depth exceeded');
    case JSON_ERROR_STATE_MISMATCH: return array(false, 'Underflow or the modes mismatch');
    case JSON_ERROR_CTRL_CHAR:      return array(false, 'Unexpected control character found');
    case JSON_ERROR_SYNTAX:         return array(false, 'Syntax error, malformed JSON');
    case JSON_ERROR_UTF8:           return array(false, 'Malformed UTF-8 characters, possibly incorrectly encoded');
    default:                        return array(false, 'Unknown error');
  }
}
