class UserIdsInput < SimpleForm::Inputs::Base
  def input(wrapper_options)
    merged_input_options = merge_wrapper_options(input_html_options, wrapper_options)
    merged_input_options[:class] << "select-user"
    if @options[:only_delegates]
      merged_input_options[:class] << "select-user-only_delegates"
    end
    if @options[:search_persons]
      merged_input_options[:class] << "select-user-search_persons"
    end
    if @options[:only_one]
      merged_input_options[:class] << "select-user-only_one"
    end
    @builder.text_field(attribute_name, merged_input_options)
  end
end
