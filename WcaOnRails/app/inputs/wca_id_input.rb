# frozen_string_literal: true

class WcaIdInput < SimpleForm::Inputs::Base
  def input(wrapper_options)
    merged_input_options = merge_wrapper_options(input_html_options, wrapper_options)
    merged_input_options[:style] = "text-transform: uppercase;"
    merged_input_options[:maxlength] = User::WCA_ID_MAX_LENGTH
    @builder.text_field(attribute_name, merged_input_options)
  end
end
