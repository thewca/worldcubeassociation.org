<?php

function print_menu($items, $currentSection = "") {
    foreach( $items as $item ){
        $name   = $item[0];
        $active = ($item[1] == $currentSection) ? 'id="activePage"' : '';
        $href   = pathToRoot() . (isset($item[2]) ? $item[2] : $item[1].'.php');
        echo "<li class='item'><a href='$href' $active>$name</a></li>\n";
    }
}
