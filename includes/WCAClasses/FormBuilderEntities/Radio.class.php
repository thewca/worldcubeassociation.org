<?php
/* @file
 * 
 * This file implements basic functionality for creating and validating form elements.
 * 
 * Please help improve this class!  Extending functionality here can help us implement a maintainable codebase.
 * 
 */
namespace WCAClasses\FormBuilderEntities;

class Radio extends Select
{
    public function render()
    {
    	if(!$this->value_is_valid) {
            $this->attribute("ERROR");
        }
        $output = "<div class='form-element-wrapper'>";
        
        if($this->label && $this->attributes['id']) {
            $output .= "<span id='" . o($this->attributes['id']) . "'>" . o($this->label) . ": </span>";
        }

        $output .= "<span " . ($this->getAttributeString()) . ">";
        foreach($this->options as $value => $option) {
            $option = o($option);
            $value = o($value);
            $output .= "<span class='form-element-radio-option'>";
            if($option) {
            	$output .= "<label for='" . o($this->attributes['id']) . "-{$value}'>{$option}: </label>";
            }
            if($value == $this->selected_option) {
                $output .= "<input type='radio' name='" . o($this->name) . "' id='" . o($this->attributes['id']) . "-{$value}' value='{$value}' selected />";
            } else {
                $output .= "<input type='radio' name='" . o($this->name) . "' id='" . o($this->attributes['id']) . "-{$value}' value='{$value}' />";
            }
            $output .= "</span>";
        }
        $output .= "</span>";

        $output .= "</div>";
        return $output;
    }
}
