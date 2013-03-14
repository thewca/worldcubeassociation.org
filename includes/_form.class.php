<?php

/* @file
 * 
 * This file implements basic functionality for creating and validating forms.
 * 
 * Please help improve this class!  Extending functionality here can help us implement a maintainable codebase.
 * 
 */

/*
 * @var FormBuilder
 * A class used to create, validate, and display forms.
 */
class FormBuilder extends FormBuilderValidators
{
    // $elements should be an array of form elements.
    public $elements;

    private $attributes;
    private $anticsrf_key;

    public function __construct($attributes = array('method'=>'POST'), $secure = TRUE)
    {
        $this->action = $action;
        $this->attributes = $attributes;

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

    // default render of whole form
    public function render()
    {
        $attr_str = $this->assembleAttributes();
        $output = "<form" . $attr_str . ">";

        // if this is a secure form, then:
        if($this->anticsrf_key) {
            // add form element validation
            $this->element('anticsrf_key')
                 ->setAttribute('type', "'hidden'")
                 ->setAttribute('value', "'" . ($this->anticsrf_key) . "'");
        }

        $elements = $this->elements;
        foreach($elements as $name => $element) {
            $output .= $this->renderElement($name) . "\n";
        }
        $output .= "</form>";

        return $output;
    }

    // render specific elements, allows for more control if needed
    public function renderElement($name)
    {
        if(!isset($this->elements[$name])) {
            trigger_error("Element not created - cannot render.", E_USER_WARNING);
        }
        $element = $this->elements[$name];

        $attr_str = $this->assembleAttributes($element->value('attributes'));

        $output = "<div class='form-element'>";
        if($element->value('label') != "") {
            $output .= '<label for="form-element-' . $name . '">' . ($element->value('label')) . '</label>';
        }
        if($element->value('tag') == "input") {
            $output .= '<input name="' . $name . '" id="form-element-' . $name . '"' . $attr_str . '/>';
        } else {
            $output .= '<' . ($element->value('tag')) . ' name="' . $name . '" id="form-element-' . $name . '"' . $attr_str . '>';
            $output .= $element->value('innerHTML');
            $output .= '</' . ($element->value('tag')) . '>';
        }
        $output .= "</div>";

        return $output;
    }

    public function element($name)
    {
        $this->elements[$name] = new FormBuilderElement($name);
        return $this->elements[$name];
    }

    public function assembleAttributes($attributes = array())
    {
        if(empty($attributes)) {
            $attributes = $this->attributes;
        }

        $attr_str = " ";
        foreach($attributes as $attr => $val) {
            $attr_str .= $attr;
            if($val !== NULL) {
                $attr_str .= '="' . $val . '" ';
            }
        }
        return $attr_str;
    }

    public function validate()
    {
        // do csrf check
        if($this->anticsrf_key) {
            // need to compare param vs session
        }

        // validate form elements
        $elements = $this->elements;
        $errors = array();
        foreach($elements as $element) {
            $valid = $element->validate();
            if($valid !== TRUE) {
                // uh-oh!
            }
        }
    }

}


/*
 * @var FormBuilderElement
 * A class used to store element data for forms.
 */
class FormBuilderElement
{
    private $name;
    private $validator;
    private $submitted_value;

    private $attributes;
    private $tag;
    private $innerHTML;
    private $label;

    public function __construct($name)
    {
        $this->name = $name;
        $this->attributes = array();
        $this->tag = "input";
        $this->innerHTML = "";
        $this->validator = FALSE;

        // Why declare this thing off limits, then make a function for accessing it anyways?
        // Just work with raw values - current functionality often garbles input anyways.
        global $rawParametersDontUseOutsideParametersModule;
            
        if(isset($_REQUEST[$name])) {
            $this->submitted_value = $_REQUEST[$name];
        } elseif(isset($rawParametersDontUseOutsideParametersModule[$name])) {
            $this->submitted_value = $rawParametersDontUseOutsideParametersModule[$name];
        } else {
            $this->submitted_value = FALSE; // return bool false if not set.
        }
    }

    // set a single attribute
    public function setAttribute($key, $value)
    {
        $this->attributes[$key] = $value;
        return $this;
    }
    // set all attributes via array
    public function setAttributes($value)
    {
        $this->attributes = $value;
        return $this;
    }
    // set element tag type
    public function setTag($tag)
    {
        $this->tag = $tag;
        return $this;
    }
    // set element innerhtml (not really applicable for <input> elements, but is for <textarea>, etc.)
    public function setInnerHTML($html)
    {
        $this->innerHTML = $html;
        return $this;
    }
    // set element label
    public function setLabel($label)
    {
        $this->label = $label;
        return $this;
    }

    // get value associated with element (default return submitted value)
    public function value($item = "")
    {
        if($item == "") {
            return $this->submitted_value;
        } elseif(isset($this->$item)) {
            return $this->$item;
        } else {
            trigger_error("Value not able to be accessed.", E_USER_WARNING);
            return;
        }
    }

    // call form validation
    public function validate()
    {
        if($this->validator) {
            return call_user_func($this->validator, array($this));
        }
        return TRUE;
    }
}


/*
 * @var FormBuilderValidators
 * A class containing basic functions for input validation.
 */
class FormBuilderValidators
{
    public function valueSubmitted($element)
    {
        if($element->value() !== FALSE) {
            return TRUE;
        }
        return FALSE;
    }
}

