<?php
/* @file
 * 
 * This file contains a class which can be used for accessing configuration settings.
 * 
 */
namespace WCAClasses;

/*
 * @var configurationData
 *
 * Available methods:
 *  - get($val): returns a stored setting value.
 *  - validateInstall: performs some basic checks seeing whether or not the install is valid.
 *
 */
class ConfigurationData
{
    // For now, data is just an array containing configuration settings.
    protected $data = NULL;

    public function __construct()
    {
        // this directory... no trailing slash here
        $includes_directory = dirname(__file__) . "/..";
        // expect an associated _config.php file (which shouldn't be included anywhere else!)
        require_once($includes_directory . "/_config.php");

        if (!isset($config) || empty($config)) {
            trigger_error("Config settings not found!", E_USER_ERROR);
        }

        if(!isset($config['pathToRoot']) || "" == $config['pathToRoot']) {
            // let's determine the current domain being used (this is for use in output links, etc)
            // do a check for unusual server configuration here.
            $docs_path = realpath($includes_directory . "/..");
            $script_path = realpath($_SERVER['DOCUMENT_ROOT'] . $_SERVER['SCRIPT_NAME']); // this should always be longer!
            // check equivalency
            $path_equiv = substr($script_path, 0, strlen($docs_path)) == $docs_path;
            if (!$path_equiv) {
                // Uh-oh, server settings have been corrupted somehow!  We'll have to guess something, so use /results/ as default.
                $config["pathToRoot"] = "/results/";
            } else {
                $part_to_strip = strlen($_SERVER['DOCUMENT_ROOT']);
                $config["pathToRoot"] = substr(realpath($includes_directory . "/.."), $part_to_strip);
            }
        }

        if(!isset($config['filesPath']) || "" == $config['filesPath']) {
            // And the current directory being used (this is for includes, etc)
            $config["filesPath"] = realpath($includes_directory . "/..");
        }

        // append trailing slash to paths if needed
        if (substr($config["pathToRoot"], -1) != "/") {
            $config["pathToRoot"] .= "/";
        }
        if (strlen($config["filesPath"]) > 0 && substr($config["filesPath"], -1) != "/") {
            $config["filesPath"] .= "/";
        }

        $this->data = $config;
    }

    public function get($value)
    {
        if (isset($this->data[$value])) {
            return $this->data[$value];
        }
        trigger_error("Config setting not found!", E_USER_WARNING);
    }

    public function validateInstall()
    {
        // Perform some validation of system installation here.
        $filesPath = $this->data["filesPath"];
        $pathToRoot = $this->data["pathToRoot"];
        $errors = Array();

        if (!file_exists($filesPath . 'generated/cachedDatabase.php')) {
            $errors[] = "Missing cachedDatabase.php file! Go <a href='{$pathToRoot}admin/compute_auxiliary_data.php'>here</a> to generate this file.";
        }
        
        $writable_paths = Array("uploads", "generated", "generated/cache");
        foreach($writable_paths as $path) {
            $fullpath = $filesPath . $path;
            if (!is_writable($fullpath) || !file_exists($fullpath)) {
                $errors[] = "Directory/File '" . $path . "' is missing or not writable!";
            }            
        }

        return $errors;
    }

}
