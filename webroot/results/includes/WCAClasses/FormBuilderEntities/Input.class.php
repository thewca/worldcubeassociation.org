<?php
/* @file
 * 
 * This file implements basic functionality for creating and validating form elements.
 * 
 * Please help improve this class!  Extending functionality here can help us implement a maintainable codebase.
 * 
 */
namespace WCAClasses\FormBuilderEntities;

class Input extends Entity
{
    public function __construct($name, $type)
    {
        parent::__construct($name);
        $this->attribute("type", $type);
    }

    public function render()
    {
        $output = parent::render();
        $output .= "<div class='form-element-wrapper'>";
        
        if($this->label && $this->attributes['id']) {
            $output .= "<label for='" . o($this->attributes['id']) . "'>" . o($this->label) . ": </label>";
        }
        $output .= "<input" . ($this->getAttributeString()) . "/>";
        $output .= "</div>";
        return $output;
    }

}
