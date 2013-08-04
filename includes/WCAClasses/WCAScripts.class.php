<?php
/* @file
 * 
 * Just something to make including javascript files a bit cleaner.
 */
namespace WCAClasses;

class WCAScripts
{
    private $scripts;

    public function __construct()
    {
        $this->scripts = array();
    }

    public function add($file)
    {
        // append default js path to paths that don't start with http(s):// or //
        if(preg_match('/((https?\:\/\/)|(\/\/))(.*)/i', $file)) {
            $this->scripts[] = $file;
        } else {
            $this->scripts[] = pathToRoot() . 'js/' . $file;
        }
    }

    public function getHTMLAll()
    {
        $out = '';
        foreach($this->scripts as $script) {
            $out .= $this->_getHTML($script);
        }
        return $out;
    }

    public function _getHTML($script)
    {
        return '<script src="' . $script . '"></script>';
    }

}
