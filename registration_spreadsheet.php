<?php
#----------------------------------------------------------------------
#   Initialization and page contents.
#----------------------------------------------------------------------

$currentSection = 'competitions';

ob_start();
require( '_header.php' );
ob_end_clean();

analyseChoices();
if( checkPasswordAndLoadData() ) {
  initialiseAndCreateSpreadsheet();
  fillRegistration();
  fillEvents();
  saveSpreadsheet();
#  writeSpreadsheet();
}

#----------------------------------------------------------------------
function analyseChoices () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword, $chosenFormat, $chosenUnit;

  $chosenCompetitionId = getNormalParam( 'competitionId' );
  $chosenPassword = getNormalParam( 'password' );

  foreach( getAllEventIds() as $eventId ) {
    $chosenFormat[$eventId] = getNormalParam( "format$eventId" );
    $chosenUnit[$eventId] = getNormalParam( "unit$eventId" );
  }
}

#----------------------------------------------------------------------
function checkPasswordAndLoadData () {
#----------------------------------------------------------------------
  global $chosenCompetitionId, $chosenPassword, $data;

  #--- Load the competition data from the database.
  $results = dbQuery( "SELECT * FROM Competitions WHERE id='$chosenCompetitionId'" );
  
  #--- Check the competitionId.
  if( count( $results ) != 1 ) {
    showErrorMessage( "unknown competitionId [$chosenCompetitionId]" );
    return false;
  }

  #--- Competition exists, so get its data.
  $data = $results[0];

  #--- Check the password.
  if( $chosenPassword != $data['password'] ) {
    showErrorMessage( "wrong password" );
    return false;
  }

  return true;
}


#----------------------------------------------------------------------
function initialiseAndCreateSpreadsheet () {
#----------------------------------------------------------------------
  global $spreadsheet;

  error_reporting(E_ALL);

  require_once 'PHPExcel.php';

  $spreadsheet = new PHPExcel();

}

#----------------------------------------------------------------------
function fillRegistration () {
#----------------------------------------------------------------------
  global $spreadsheet, $chosenCompetitionId, $data;

  #--- Create registration worksheet.

  $registrationSheet = $spreadsheet->getActiveSheet();
  $registrationSheet->setTitle( 'Registration' );

  #--- Show gridlines - not working.

  $registrationSheet->setShowGridlines( true );
  $registrationSheet->setPrintGridlines( true );

  #--- Set size of columns - Seems to be broken...
  /*
  foreach( $registrationSheet->getColumnDimensions() as $columnDimension )
    $columnDimension->setAutoSize( true );

  $registrationSheet->getColumnDimension( 'B' )->setAutoSize( true );
  $registrationSheet->getColumnDimension( 'C' )->setAutoSize( true );
  $registrationSheet->getColumnDimension( 'D' )->setAutoSize( true );
  */

  $registrationSheet->freezePane( 'A4' );


  $regs = dbQuery("SELECT * FROM Preregs WHERE competitionId = '$chosenCompetitionId'");
  $regsCount = count( $regs );

  #--- Fill worksheet header.

  $registrationSheet->setCellValue( 'A1', $data['name'] );
  $registrationSheet->setCellValue( 'A3', '#' );
  $registrationSheet->setCellValue( 'B3', 'Name' );
  $registrationSheet->setCellValue( 'C3', 'Country' );
  $registrationSheet->setCellValue( 'D3', 'WCA id' );
  $registrationSheet->setCellValue( 'E3', 'Gender (f/m)' );
  $registrationSheet->setCellValue( 'F3', 'Date-of-birth' );

  $col = 7;
  $eventIds = getEventSpecsEventIds( $data['eventSpecs'] );
  foreach( $eventIds as $eventId ) {
    $letter = chr( ord( 'A' ) + $col );
    $registrationSheet->setCellValueByColumnAndRow( $col, 2, "=SUM(${letter}4:$letter" . ( 4+$regsCount ) . ")");
    $registrationSheet->setCellValueByColumnAndRow( $col, 3, $eventId );
    $col += 1;
  }
  $registrationSheet->setCellValueByColumnAndRow( $col, 3, 'Email' );
  $registrationSheet->setCellValueByColumnAndRow( $col+1, 3, 'Guests' );
  $registrationSheet->setCellValueByColumnAndRow( $col+2, 3, 'IP' );


  #--- Fill worksheet content.

  $row = 4;
  foreach( $regs as $reg ) {
    extract( $reg );

    $registrationSheet->setCellValueByColumnAndRow( 0, $row, $row-3 );
    $registrationSheet->setCellValueByColumnAndRow( 1, $row, $name );
    $registrationSheet->setCellValueByColumnAndRow( 2, $row, $countryId );
    $registrationSheet->setCellValueByColumnAndRow( 3, $row, $personId );
    $registrationSheet->setCellValueByColumnAndRow( 4, $row, $gender );

    $DoB = gmmktime(0,0,0,$birthMonth,$birthDay,$birthYear);
    $registrationSheet->setCellValueByColumnAndRow( 5, $row, PHPExcel_Shared_Date::PHPToExcel($DoB));
    $registrationSheet->getStyleByColumnAndRow( 5, $row )->getNumberFormat()->setFormatCode(PHPExcel_Style_NumberFormat::FORMAT_DATE_YYYYMMDD2);

    $col = 7;
    foreach( $eventIds as $eventId ) {
      $registrationSheet->setCellValueByColumnAndRow( $col, $row, $reg["E$eventId"] );
      $col += 1;
    }

    $registrationSheet->setCellValueByColumnAndRow( $col, $row, $email );
    $guests = str_replace(array("\r\n", "\n", "\r", ","), ";", $guests);
    $registrationSheet->setCellValueByColumnAndRow( $col+1, $row, $guests );
    $registrationSheet->setCellValueByColumnAndRow( $col+2, $row, $ip );

    $row += 1;
  }



}

#----------------------------------------------------------------------
function fillEvents () {
#----------------------------------------------------------------------
  global $spreadsheet, $chosenCompetitionId, $chosenFormat, $chosenUnit, $data;

  $eventIds = getEventSpecsEventIds( $data['eventSpecs'] );
  $persons = dbQuery("SELECT * FROM Preregs WHERE competitionId = '$chosenCompetitionId'");

  foreach( $eventIds as $eventId ) {

    #--- Create event worksheet.

    $eventSheet = $spreadsheet->createSheet();
    $eventSheet->setTitle( eventCellName( $eventId ));

    $eventPersons = null;
    foreach( $persons as $person )
      if( $person["E$eventId"] )
        $eventPersons[] = $person;

    #--- Fill event worksheet.

    fillEventsHeader  ( $eventSheet, $eventId );
    fillEventsPersons ( $eventSheet, $eventId, $eventPersons );
    fillEventsStyle   ( $eventSheet, $eventId, count( $eventPersons ) );

  }
}


#----------------------------------------------------------------------
function fillEventsHeader ( $eventSheet, $eventId ) {
#----------------------------------------------------------------------
  global $chosenFormat, $chosenUnit;

  $formatId = $chosenFormat[$eventId];
  $unit = $chosenUnit[$eventId];

  #--- Fill beginning of worksheet.

  $eventSheet->setCellValue( 'A1', eventName( $eventId ));

  $formats = dbQuery( "SELECT * FROM Formats" );
  foreach( $formats as $format )
    if( $format['id'] == $formatId )
      $formatName = $format['name'];

  $eventSheet->setCellValue( 'A2', "Format: $formatName");

  switch( $unit ) {
    case 'seconds':
      $eventSheet->setCellValue( 'A3', 'time in seconds (ss.hh)' );
      break;

    case 'minutes':
      $eventSheet->setCellValue( 'A3', 'time in minutes (m:ss.hh)' );
      break;

    case 'number':
      $eventSheet->setCellValue( 'A3', 'number' );
      break;

    case 'multi':
      $eventSheet->setCellValue( 'A3', 'time in seconds' );
      break;
  }

  #--- Fill table header.

  $eventSheet->setCellValue( 'A4', 'Position' );
  $eventSheet->setCellValue( 'B4', 'Name' );
  $eventSheet->setCellValue( 'C4', 'Country' );
  $eventSheet->setCellValue( 'D4', 'WCA id' );


  if( $unit == 'multi' ) {

    switch( $formatId ) {
      case '1':
        $eventSheet->setCellValue( 'E4', '# tried' );
        $eventSheet->setCellValue( 'F4', '# solved' );
        $eventSheet->setCellValue( 'G3', 'trick: 25:37 => =25*60+37' );
        $eventSheet->setCellValue( 'G4', 'seconds' );
        $eventSheet->setCellValue( 'H4', 'WR' );
        $eventSheet->setCellValue( 'I3', 'sort asc by score>0' );
        $eventSheet->setCellValue( 'I4', 'score' );
        break;

      case '2':
        $eventSheet->setCellValue( 'E3', '1' );
        $eventSheet->setCellValue( 'E4', '# tried' );
        $eventSheet->setCellValue( 'F4', '# solved' );
        $eventSheet->setCellValue( 'G3', 'trick: 25:37 => =25*60+37' );
        $eventSheet->setCellValue( 'G4', 'seconds' );
        $eventSheet->setCellValue( 'H4', 'score' );
        $eventSheet->setCellValue( 'I3', '2' );
        $eventSheet->setCellValue( 'I4', '# tried or DNS' );
        $eventSheet->setCellValue( 'J4', '# solved' );
        $eventSheet->setCellValue( 'K4', 'seconds' );
        $eventSheet->setCellValue( 'L4', 'score' );
        $eventSheet->setCellValue( 'M3', 'sort asc by score>0' );
        $eventSheet->setCellValue( 'M4', 'best' );
        $eventSheet->setCellValue( 'N4', 'WR' );
        break;

      case '3':
        $eventSheet->setCellValue( 'E3', '1' );
        $eventSheet->setCellValue( 'E4', '# tried' );
        $eventSheet->setCellValue( 'F4', '# solved' );
        $eventSheet->setCellValue( 'G3', 'trick: 25:37 => =25*60+37' );
        $eventSheet->setCellValue( 'G4', 'seconds' );
        $eventSheet->setCellValue( 'H4', 'score' );
        $eventSheet->setCellValue( 'I3', '2' );
        $eventSheet->setCellValue( 'I4', '# tried or DNS' );
        $eventSheet->setCellValue( 'J4', '# solved' );
        $eventSheet->setCellValue( 'K4', 'seconds' );
        $eventSheet->setCellValue( 'L4', 'score' );
        $eventSheet->setCellValue( 'M3', '3' );
        $eventSheet->setCellValue( 'M4', '# tried or DNS' );
        $eventSheet->setCellValue( 'N4', '# solved' );
        $eventSheet->setCellValue( 'O4', 'seconds' );
        $eventSheet->setCellValue( 'P4', 'score' );
        $eventSheet->setCellValue( 'Q3', 'sort asc by score>0' );
        $eventSheet->setCellValue( 'Q4', 'best' );
        $eventSheet->setCellValue( 'R4', 'WR' );
        break;
    }
  }

  else {

    switch( $formatId ) {
      case '1':
        $eventSheet->setCellValue( 'E4', 'Result' );
        $eventSheet->setCellValue( 'F4', 'WR' );
        break;

      case '2':
        $eventSheet->setCellValue( 'E4', '1' );
        $eventSheet->setCellValue( 'F4', '2' );
        $eventSheet->setCellValue( 'G4', 'Best' );
        $eventSheet->setCellValue( 'H4', 'WR' );
        break;

      case '3':
        $eventSheet->setCellValue( 'E4', '1' );
        $eventSheet->setCellValue( 'F4', '2' );
        $eventSheet->setCellValue( 'G4', '3' );
        $eventSheet->setCellValue( 'H4', 'Best' );
        $eventSheet->setCellValue( 'I4', 'WR' );
        break;

      case 'm':
        $eventSheet->setCellValue( 'E4', '1' );
        $eventSheet->setCellValue( 'F4', '2' );
        $eventSheet->setCellValue( 'G4', '3' );
        $eventSheet->setCellValue( 'H4', 'Best' );
        $eventSheet->setCellValue( 'I4', 'WR' );
        $eventSheet->setCellValue( 'J4', 'Average' );
        $eventSheet->setCellValue( 'K4', 'WR' );
        break;

      case 'a':
        $eventSheet->setCellValue( 'E4', '1' );
        $eventSheet->setCellValue( 'F4', '2' );
        $eventSheet->setCellValue( 'G4', '3' );
        $eventSheet->setCellValue( 'H4', '4' );
        $eventSheet->setCellValue( 'I4', '5' );
        $eventSheet->setCellValue( 'J4', 'Best' );
        $eventSheet->setCellValue( 'K4', 'WR' );
        $eventSheet->setCellValue( 'L4', 'Worst' );
        $eventSheet->setCellValue( 'M4', 'Average' );
        $eventSheet->setCellValue( 'N4', 'WR' );
        break;
    }
  }
}


#----------------------------------------------------------------------
function fillEventsPersons ( $eventSheet, $eventId, $persons ) {
#----------------------------------------------------------------------
  global $chosenFormat, $chosenUnit;

  $formatId = $chosenFormat[$eventId];
  $unit = $chosenUnit[$eventId];

  $row = 5;

  foreach( $persons as $person ) {

    extract( $person );

    #--- Fill rank formula.

    $rowm = $row - 1;

    if( $unit == 'multi' ) {

      switch( $formatId ) {
        case '1':
          $eventSheet->setCellValueByColumnAndRow( 0, $row, "=if(I$rowm=I$row,A$rowm,row()-4)" );
          break;

        case '2':
          $eventSheet->setCellValueByColumnAndRow( 0, $row, "=if(M$rowm=M$row,A$rowm,row()-4)" );
          break;

        case '3':
          $eventSheet->setCellValueByColumnAndRow( 0, $row, "=if(Q$rowm=Q$row,A$rowm,row()-4)" );
          break;
      }
    }
    else {

      switch( $formatId ) {
        case '1':
          $eventSheet->setCellValueByColumnAndRow( 0, $row, "=if(E$rowm=E$row,A$rowm,row()-4)" );
          break;

        case '2':
          $eventSheet->setCellValueByColumnAndRow( 0, $row, "=if(G$rowm=G$row,A$rowm,row()-4)" );
          break;

        case '3':
          $eventSheet->setCellValueByColumnAndRow( 0, $row, "=if(H$rowm=H$row,A$rowm,row()-4)" );
          break;

        case 'm':
          $eventSheet->setCellValueByColumnAndRow( 0, $row, "=if(and(H$rowm=H$row,J$rowm=J$row),A$rowm,row()-4)" );
          break;

        case 'a':
          $eventSheet->setCellValueByColumnAndRow( 0, $row, "=if(and(M$rowm=M$row,J$rowm=J$row),A$rowm,row()-4)" );
          break;
      }
    }

    #--- Fill persons.

    $eventSheet->setCellValueByColumnAndRow( 1, $row, $name );
    $eventSheet->setCellValueByColumnAndRow( 2, $row, $countryId );
    $eventSheet->setCellValueByColumnAndRow( 3, $row, $personId );


    #--- Fill best and average formulas.

    if( $unit == 'multi' ) {

      switch( $formatId ) {
        case '1':
          $eventSheet->setCellValueByColumnAndRow( 8, $row, "=if(E$row-F$row>F$row,-1,(99-F$row+E$row-F$row)*10000000+G$row*100+E$row-F$row)" );
          break;

        case '2':
          $eventSheet->setCellValueByColumnAndRow( 7, $row, "=if(E$row-F$row>F$row,-1,(99-F$row+E$row-F$row)*10000000+G$row*100+E$row-F$row)" );
          $eventSheet->setCellValueByColumnAndRow( 11, $row, "=if(I$row=\"DNS\",-2,if(I$row-J$row>J$row,-1,(99-J$row+I$row-J$row)*10000000+K$row*100+I$row-J$row))" );
          $eventSheet->setCellValueByColumnAndRow( 12, $row, "=if(and(H$row<0,L$row<0),-1,if(H$row<0,L$row,if(L$row<0,H$row,min(H$row,L$row))))" );
          break;

        case '3':
          $eventSheet->setCellValueByColumnAndRow( 7, $row, "=if(E$row-F$row>F$row,-1,(99-F$row+E$row-F$row)*10000000+G$row*100+E$row-F$row)" );
          $eventSheet->setCellValueByColumnAndRow( 11, $row, "=if(I$row=\"DNS\",-2,if(I$row-J$row>J$row,-1,(99-J$row+I$row-J$row)*10000000+K$row*100+I$row-J$row))" );
          $eventSheet->setCellValueByColumnAndRow( 15, $row, "=if(M$row=\"DNS\",-2,if(M$row-N$row>N$row,-1,(99-N$row+M$row-N$row)*10000000+O$row*100+M$row-N$row))" );
          $eventSheet->setCellValueByColumnAndRow( 16, $row, "TODO..." );
          break;
      }
    }
    else {

      switch( $formatId ) {
        case '1':
          break;

        case '2':
          $eventSheet->setCellValueByColumnAndRow( 6, $row, "=if(min(E$row:F$row)>0,min(E$row:F$row),if(countblank(E$row:F$row)=2,\"\",\"DNF\"))" );
          break;

        case '3':
          $eventSheet->setCellValueByColumnAndRow( 7, $row, "=if(min(E$row:G$row)>0,min(E$row:G$row),if(countblank(E$row:G$row)=3,\"\",\"DNF\"))" );
          break;

        case 'm':
          $eventSheet->setCellValueByColumnAndRow( 7, $row, "=if(min(E$row:G$row)>0,min(E$row:G$row),if(countblank(E$row:G$row)=3,\"\",\"DNF\"))" );
          $eventSheet->setCellValueByColumnAndRow( 9, $row, "=if(countblank(E$row:G)>0,\"\",if(countif(E$row:I$row,\"DNF\")+countif(E$row:I$row,\"DNS\")>0,\"DNF\",average(E$row:G$row)))" );
          break;

        case 'a':
          $eventSheet->setCellValueByColumnAndRow( 9, $row, "=if(min(E$row:I$row)>0,min(E$row:I$row),if(countblank(E$row:I$row)=5,\"\",\"DNF\"))" );
          $eventSheet->setCellValueByColumnAndRow( 11, $row, "=if(countblank(E$row:I$row)>0,\"\",if(countif(E$row:I$row,\"DNF\")+countif(E$row:I$row,\"DNS\")>0,\"DNF\",max(E$row:I$row)))" );
          $eventSheet->setCellValueByColumnAndRow( 12, $row, "=if(countblank(E$row:I$row)>0,\"\",if(countif(E$row:I$row,\"DNF\")+countif(E$row:I$row,\"DNS\")>1,\"DNF\",if(countif(E$row:I$row,\"DNF\")+countif(E$row:I$row,\"DNS\")>0,(sum(E$row:I$row)-J$row)/3,(sum(E$row:I$row)-J$row-L$row)/3)))" );
          break;
      }
    }

    $row += 1;

  }
}

#----------------------------------------------------------------------
function fillEventsStyle ( $eventSheet, $eventId, $nbPersons ) {
#----------------------------------------------------------------------
  global $chosenFormat, $chosenUnit;

  $formatId = $chosenFormat[$eventId];
  $unit = $chosenUnit[$eventId];

  $style = new PHPExcel_Style();


  if( $unit == 'multi' ) {
  }

  else {

    switch( $unit ) {
      case 'seconds':
        $style->getNumberFormat()->setFormatCode( '0.00' );
        break;
      case 'minutes':
        $style->getNumberFormat()->setFormatCode( 'm:ss.00' );
        break;
      case 'number':
        $style->getNumberFormat()->setFormatCode( '0' );
        break;
    }

    switch( $formatId ) {
      case '1':
        $eventSheet->setSharedStyle( $style, 'E5:E' . ( 4 + $nbPersons ));
        break;

      case '2':
        $eventSheet->setSharedStyle( $style, 'E5:G' . ( 4 + $nbPersons ));
        break;

      case '3':
        $eventSheet->setSharedStyle( $style, 'E5:H' . ( 4 + $nbPersons ));
        break;

      case 'm':
        $eventSheet->setSharedStyle( $style, 'E5:H' . ( 4 + $nbPersons ));
        $eventSheet->setSharedStyle( $style, 'J5:J' . ( 4 + $nbPersons ));
        break;

      case 'a':
        $eventSheet->setSharedStyle( $style, 'E5:J' . ( 4 + $nbPersons ));
        $eventSheet->setSharedStyle( $style, 'L5:M' . ( 4 + $nbPersons ));
        break;
    }
  }

  #--- TODO, forme à utiliser:
  /*
$workbook->getActiveSheet()->duplicateStyleArray(
	array(
		'font'    => array(
			'bold'      => true,
			'size'      => 14
		),
		'alignment' => array(
			'horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_CENTER,
		),
		'borders' => array(
			'top'     => array(
					'style' => PHPExcel_Style_Border::BORDER_THIN
					),
			'left'     => array(
					'style' => PHPExcel_Style_Border::BORDER_THIN
					),
			'bottom'     => array(
					'style' => PHPExcel_Style_Border::BORDER_THIN
					),
			'right'     => array(
					'style' => PHPExcel_Style_Border::BORDER_THIN
					)
		)
	),
	'A1:B1'
);
*/

}


#----------------------------------------------------------------------
function writeSpreadsheet () {
#----------------------------------------------------------------------
  global $spreadsheet, $chosenCompetitionId;

  $spreadsheetWriter = PHPExcel_IOFactory::createWriter($spreadsheet, 'Excel2007');
  $spreadsheetWriter->save( 'results.xlsx' );

}

#----------------------------------------------------------------------
function saveSpreadsheet () {
#----------------------------------------------------------------------
  global $spreadsheet, $chosenCompetitionId, $chosenPassword;

  #--- Redirect output to a client’s web browser.
  header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  header("Content-Disposition: attachment;filename=\"$chosenCompetitionId.xlsx\"");
  header('Cache-Control: max-age=0');

  $spreadsheetWriter = PHPExcel_IOFactory::createWriter($spreadsheet, 'Excel2007');
  $spreadsheetWriter->save('php://output');

}

?>
