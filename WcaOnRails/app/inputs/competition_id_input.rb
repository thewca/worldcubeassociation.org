class CompetitionIdInput < SimpleForm::Inputs::Base
  def input(wrapper_options)
    merged_input_options = merge_wrapper_options(input_html_options, wrapper_options)
    merged_input_options[:class] << "competitions-autocomplete"
    @builder.text_field(attribute_name, merged_input_options)
  end
end
