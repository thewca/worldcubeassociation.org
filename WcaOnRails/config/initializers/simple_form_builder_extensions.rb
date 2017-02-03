# frozen_string_literal: true

# Add a id_for method to simple forms.
# Inspired by http://stackoverflow.com/a/4820814

module SimpleForm
  class FormBuilder
    def id_for(method, options = {})
      InstanceTagWithIdFor.new(object_name, method, self, options).id_for(options)
    end

    attr_accessor :generated_attribute_inputs
    old_input = instance_method(:input)
    define_method(:input) do |attribute_name, options = {}, &block|
      @generated_attribute_inputs ||= []
      @generated_attribute_inputs << attribute_name
      old_input.bind(self).call(attribute_name, options, &block)
    end
  end
end

class InstanceTagWithIdFor < ActionView::Helpers::Tags::Base
  def id_for(options)
    add_default_name_and_id(options)
    options['id']
  end
end
