# frozen_string_literal: true

# Keep track of which attributes we've built.
# Inspired by http://stackoverflow.com/a/4820814

# Originally used to generate error href IDs, but in Rails 7 no longer necessary to monkey-patch.

module SimpleForm
  class FormBuilder
    attr_accessor :generated_attribute_inputs
    old_input = instance_method(:input)
    define_method(:input) do |attribute_name, options = {}, &block|
      @generated_attribute_inputs ||= []
      @generated_attribute_inputs << attribute_name
      old_input.bind(self).call(attribute_name, **options, &block)
    end
  end
end
