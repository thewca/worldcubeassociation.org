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
class Markup extends Entity
{
    private $markup;

    public function __construct($markup)
    {
        parent::__construct("");        
        $this->markup = $markup;
        $this->validator_function = NULL; // Can't really validate this.
    }

    public function render()
    {
        return $this->markup;
    }

}
