<?php

/* @file
 * 
 * This file loads the Drupal API and provides a simple class @drupalPost for posting nodes.
 * Specify a $nid to load a previous competition announcement or post for modification.
 * 
 */

try
{
    $drupal_conf = $config->get('drupal');
    if (!defined('DRUPAL_ROOT')) {
        define('DRUPAL_ROOT', $drupal_conf['path']);  // Drupal needs this to be defined in order to work.
    }

    require_once  DRUPAL_ROOT . '/includes/bootstrap.inc';
    drupal_bootstrap(DRUPAL_BOOTSTRAP_FULL);
    module_load_include('inc', 'node', 'node.pages');

    if(0 == $user->uid) {
        drupal_save_session(FALSE);
        $user = user_load(1);
    }
}
catch(Exception $e)
{
    throw new Exception("Unable to load Drupal API!", $e);
    exit;
}


/*
 * @var drupalPost
 * A class used for constructing a Drupal posting.
 *
 * Available methods:
 *  - field: set a content type field for the node
 *  - value: set a non-field value
 *  - post: post it!
 * 
 * For this class, we create a node object, and associated "submission" form.  We could just use
 * the node_save() function directly on node data, but this won't trigger all validation hooks.
 * So instead, we create a mock node submission form, and submit data via drupal_form_submit.
 *
 * The value method should be used to set values that aren't associated with Drupal's field API.
 * This includes "title" and "body" content, which are specified by the node module.
 *
 * The field method should be used to set values that are associated with Drupal's field API.
 *
 * Not specifying a value will return return any currently set value.
 *
 */
class drupalPost
{

    protected $node = NULL;
    protected $formState = NULL;
    protected $postError = FALSE;

    public function __construct($type, $nid = NULL)
    {
        // get Drupal user for posting... default to admin user
        $user = isset($_GLOBALS['user']) ? $_GLOBALS['user'] : user_load(1);

        // load a node if $nid is specified, otherwise create and initialize a new node object
        if($nid) {
            $node = node_load($nid);
        } else {
            // new object of certain type/language
            $node = new stdClass();
            $node->type = $type;
            $node->language = LANGUAGE_NONE;
            // invoke Drupal hook... set some default values and such
            node_object_prepare($node);
            // explicitly set some defaults
            $node->changed = $node->created;
            $node->status = 1; // Published by default
            $node->promote = 1;
            $node->sticky = 0;
            $node->comment = 0;
            $node->format = 1; // Filtered HTML
            $node->uid = $user->uid; // UID of content owner
            $node->is_new = TRUE;
        }

        $this->node = $node;
        
        // pseudo-form for later submission.
        // perhaps this should contain default values loaded from node?
        $this->formState = array(
            'values' => array(
                'op' => t('Save'),
                'name' => $user->name
            )
        );
    }

    // set a Field API value (and return object) or retreive a Field API value
    public function field($field, $value = "", $special = 'value')
    {
        $formState = $this->formState;

        if("" != $value) {
            // field api values are stored in a $formState array per-language and per-field:
            $formState['values'][$field][$this->node->language][0][$special] = $value;
            $this->formState = $formState;
            
            return $this;
        }

        return $formState['values'][$field][$this->node->language][0][$special];
    }

    // set a value not associated with Field API, or retreive value
    public function value($id, $value = "")
    {
        $formState = $this->formState;

        if("" != $value) {
            // values are stored in $formState array as $id => $value pairs
            $formState['values'][$id] = $value;
            $this->formState = $formState;

            return $this;
        }
        
        return $formState['values'][$id];
    }

    // submit the form.
    public function post()
    {
        $node = $this->node;
        $formState = $this->formState;

        // attempt to submit "form"...
        $result = drupal_form_submit("{$node->type}_node_form", $formState, $node);

        $this->postError = FALSE;
        if(form_get_errors()) {
            $this->postError = form_get_errors();
            // if things didn't work or validate for some reason, let's generate a non-fatal error message.
            foreach(form_get_errors() as $id => $error) {
                trigger_error("Drupal form submission error while processing <pre>{$id}</pre>:<br /><pre>{$error}</pre>", E_USER_WARNING);
            }
        }

        return $this;
    }

    public function postError()
    {
        return $this->postError;
    }

}
