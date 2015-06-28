<?php
/* @file
 * 
 * This file implements basic functionality for creating and validating form elements.
 * 
 * Please help improve this class!  Extending functionality here can help us implement a maintainable codebase.
 * 
 */
namespace WCAClasses\FormBuilderEntities;

/*
 * @var FormBuilderElement
 * A class used to store element data for forms.  Should be extended
 * for a specific input element type.
 */
class Entity
{
    // common information for inputs
    protected $name;
    protected $label;
    protected $submitted_value;
    protected $attributes;

    protected $validator_function;
    protected $value_is_valid;
    protected $error_message;

    public function __construct($name)
    {
        $this->name = $name;
        $this->validator("valueIsSubmitted"); // fields are required by default.
        $this->value_is_valid = TRUE;
        $this->error_message = "Invalid value submitted for field '{$name}'.";
        $this->label = "";
        $this->attributes = array("name" => $name, "id" => "form-element-{$name}",
                                    "class" => "form-element form-element-{$name}");

        // Get submitted value - work with raw values, since current functionality can garble input.
        global $rawParametersDontUseOutsideParametersModule;            
        if(isset($_REQUEST[$name])) {
            $this->submitted_value = $_REQUEST[$name];
        } elseif(isset($rawParametersDontUseOutsideParametersModule[$name])) {
            $this->submitted_value = $rawParametersDontUseOutsideParametersModule[$name];
        } else {
            $this->submitted_value = FALSE; // FALSE if nothing submitted
        }
    }

    /* set label for element */
    public function getName()
    {
        return $this->name;
    }

    /* set label for element */
    public function label($label)
    {
        $this->label = $label;
        return $this;
    }

    /* get (or set) value associated with element (which by default is the submitted value or NULL) */
    public function value($value = NULL)
    {
        if($value == NULL) {
            return $this->submitted_value;
        }
        $this->submitted_value = $value;
        return $this;
    }

    /* attributes to set in element tag */
    // set one attribute
    public function attribute($name, $value = "")
    {
        $this->attributes[$name] = $value;
        return $this;
    }
    // set all attributes (overwrites old, so can be used to clear)
    public function attributes($all)
    {
        $this->attributes = $all;
        return $this;
    }
    // get string of attributes for output.
    public function getAttributeString()
    {
        $output = " ";
        foreach($this->attributes as $name => $value) {
            $output .= o($name);
            if($value != "") {
                $output .= "='" . o($value) . "'";
            }
            $output .= " ";
        }
        return $output;
    }

    /* generic rendering options */
    public function render()
    {
        if(!$this->value_is_valid) {
            $this->attribute("ERROR");
        }
        return "";
    }

    /* set validator function for element. */
    public function validator($function_name, $error_message = NULL)
    {
        if($error_message !== NULL) {
            $this->error_message = $error_message;
        }

        // remove function? (causes element to always validate)
        if(!$function_name) {
            $this->validator_function = NULL;
            return $this;
        }

        // a method in this class should override any generic function
        if(method_exists($this, $function_name)) {
            $this->validator_function = $function_name;
            return $this;
        }

        // look for generic function
        if(function_exists($function_name)) {
            $this->validator_function = $function_name;
            return $this;
        }

        user_error("Function referenced does not seem to exist", E_USER_WARNING);
        return $this;
    }

    /* Element value validation - execute validation function functions should return only bool TRUE on success */
    public function validate()
    {
        // no validation if no function exists
        if(is_null($this->validator_function)) {
            return TRUE;
        }

        // if a Method exists here, apply it to the value and return its response
        if(method_exists($this, $this->validator_function)) {
            $validator = $this->validator_function;
            $this->value_is_valid = $this->$validator($this);
            return ($this->value_is_valid === TRUE) ? TRUE : FALSE;
        }

        // if a validator function exists, apply it to the value and return its response
        if(function_exists($this->validator_function)) {
            $this->value_is_valid = call_user_func($this->validator_function, $this);
            return ($this->value_is_valid === TRUE) ? TRUE : FALSE;
        }

        // otherwise, no validation function call possible.
        trigger_error("Unable to call error function.", E_USER_WARNING);
    }

    /* invoke this to invalidate a form element (alternative to using a validation function) */
    public function invalidate($message = "Invalid entry.")
    {
        $this->validator('isNotValid');
        $this->error_message = $message;
        return $this;
    }

    public function errorMessage()
    {
        if($this->value_is_valid) {
            return "";
        } else {
            return $this->error_message;
        }
    }


    /* Some common validation functions */
    public function valueIsSubmitted($element)
    {
        if($element->value() !== FALSE) {
            return TRUE;
        }
        return FALSE;
    }
    public function isNonzeroNumer($element)
    {
        if($element->value()*1 != 0) {
            return TRUE;
        }
        return FALSE;
    }
    public function isValid($element)
    {
        return TRUE;
    }
    public function isNotValid($element)
    {
        return FALSE;
    }

}
