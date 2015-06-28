<?php
/* @file
 * 
 * This file implements basic functionality for creating and validating form elements.
 * 
 * Please help improve this class!  Extending functionality here can help us implement a maintainable codebase.
 * 
 */
namespace WCAClasses\FormBuilderEntities;

class Select extends Entity
{
    protected $options;
    protected $selected_option;

    public function __construct($name, $options, $default_selected = NULL, $force_selected = NULL)
    {
        parent::__construct($name);
        
        $this->options = $options;
        $this->validator("valueIsOption"); // value is one of the options

        if($force_selected) {
            $this->selected_option = $force_selected;
        } elseif($this->submitted_value) {
            $this->selected_option = $this->submitted_value;
        } elseif($default_selected) {
            $this->selected_option = $default_selected;
        }
    }

    public function render()
    {
        $output = parent::render();
        $output .= "<div class='form-element-wrapper'>";
        
        if($this->label && $this->attributes['id']) {
            $output .= "<label for='" . o($this->attributes['id']) . "'>" . o($this->label) . ": </label>";
        }

        $output .= "<select" . ($this->getAttributeString()) . ">";
        foreach($this->options as $value => $option) {
            $option = o($option);
            $value = o($value);
            if($value == $this->selected_option) {
                $output .= "<option selected value='{$value}'>{$option}</option>";
            } else {
                $output .= "<option value='{$value}'>{$option}</option>";
            }
        }
        $output .= "</select>";

        $output .= "</div>";
        return $output;
    }

    public function valueIsOption($element)
    {
        if($element->value() !== FALSE && isset($this->options[$element->value()])) {
            return TRUE;
        } else {
            print $element->value();
            print_r($this->options);
            return FALSE;
        }
    }

}
