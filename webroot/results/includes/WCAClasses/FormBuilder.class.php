<?php
/* @file
 * 
 * This file implements basic functionality for creating and validating forms.
 * 
 * Please help improve this class!  Extending functionality here can help us implement a maintainable codebase.
 * 
 */
namespace WCAClasses;

/*
 * @var FormBuilder
 * A class used to create, validate, and display forms.
 */
class FormBuilder
{
    // $entities should be an array of form entities (element objects, markup objects, etc).
    private $entities;
    // properties of the <form> itself
    private $attributes;
    // does data need to be securely transmitted?
    private $anticsrf_key;
    // unique form identifier - check for submitted value here to see if form was submitted
    private $form_id;
    // submitted data
    private $submitted_data;

    // form state properties
    private $is_submitted;
    private $is_valid;

    /* Constructor / defaults */
    public function __construct($form_id, $attributes = array('method'=>'POST'), $secure = TRUE)
    {
        $this->entities = array();
        $this->attributes = $attributes;
        $this->form_id = $form_id;
        if(!isset($this->attributes["id"])) {
            $this->attributes["id"] = $form_id;
        }
        if(!isset($this->attributes["class"])) {
            $this->attributes["class"] = "form-builder";
        }

        // bit of redundancy needed to check to see if data was submitted - also want to avoid
        // any potential alterations made by _parameters.php, and don't want to rely on it, so don't use it.
        $submitted_data = array();
        // but if _parameters.php was included too, we need to use data it has moved around:
        global $rawParametersDontUseOutsideParametersModule; // Why make a function for accessing this if it's supposed to be off-limits?
        if(!empty($rawParametersDontUseOutsideParametersModule)) {
            $submitted_data = $rawParametersDontUseOutsideParametersModule;
        }
        // we want this to work when _parameters.php hasn't been included, too:
        if(isset($_REQUEST) && !empty($_REQUEST)) {
            $submitted_data = $_REQUEST;
        }
        if(isset($submitted_data[$form_id])) {
            $this->is_submitted = TRUE;
        } else {
            $this->is_submitted = FALSE;
        }
        $this->submitted_data = $submitted_data;

        if($secure == TRUE) {
            // start session if needed
            if(!isset($_SESSION)) {
                session_start();
            }
            // set session key if not set already
            if(!isset($_SESSION['anticsrf_key'])) {
                $_SESSION['anticsrf_key'] = sha1(microtime());
            }
            // store session key in object
            $this->anticsrf_key = $_SESSION['anticsrf_key'];
        } else {
            $this->anticsrf_key = FALSE;
        }
    }

    /* default render of whole form */
    public function render()
    {
        $attr_str = $this->assembleAttributes();
        $output = "<form" . $attr_str . ">";

        // add csrf key if needed
        if($this->anticsrf_key) {
            $element = new FormBuilderEntities\Input("anticsrf_key", "hidden");
            $output .= $element->attribute("value", $this->anticsrf_key)->render();
        }
        // form id element to detect submission
        $element = new FormBuilderEntities\Input($this->form_id, "hidden");
        $output .= $element->attribute("value", "1")->render();

        foreach($this->entities as $name => $object) {
            $output .= $object->render() . "\n";
        }
        $output .= "</form>";

        return $output;
    }

    /* add entity to form */
    public function addEntity($entity)
    {
        if(is_object($entity)) {
            if($entity->getName()) {
                $this->entities[$entity->getName()] = $entity;
            } else {
                $this->entities[] = $entity;
            }
        }
        return $this;
    }

    /* clear out entities - allows for reuse */
    public function clearEntities()
    {
        $this->entities = array();
        return $this;
    }

    /* Get string of attributes from array */
    public function assembleAttributes()
    {
        $attr_str = " ";
        foreach($this->attributes as $attr => $val) {
            $attr_str .= $attr;
            if($val !== NULL) {
                $attr_str .= '="' . $val . '" ';
            }
        }
        return $attr_str;
    }

    /* perform validation on submitted data */
    public function validate()
    {
        $errors = array();

        // do csrf check
        if($this->anticsrf_key) {
            if(!isset($this->submitted_data['anticsrf_key']) || $this->anticsrf_key != $this->submitted_data['anticsrf_key']) {
                $errors['anticsrf_key'] = "Invalid attempt to submit form.";
            }
        }

        // validate each form entity
        foreach($this->entities as $name => $entity) {
            $valid = $entity->validate();
            if($valid !== TRUE) {
                $errors[$name] = $entity->errorMessage();
            }
        }
        return empty($errors) ? TRUE : $errors;
    }

    /* invalidate an entry manually */
    public function invalidate($name, $message = "")
    {
        $this->entities[$name]->invalidate($message);
        return $this;
    }

    /* Check to see if data has been submitted. */
    public function submitted()
    {
        return $this->is_submitted;
    }

    /* Return submitted data. */
    public function submittedData()
    {
        return $this->submitted_data;
    }

}
