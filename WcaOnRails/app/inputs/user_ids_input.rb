class UserIdsInput < SimpleForm::Inputs::Base
  def input(wrapper_options)
    merged_input_options = merge_wrapper_options(input_html_options, wrapper_options)
    merged_input_options[:class] << "select-user"
    if @options[:delegate]
      merged_input_options[:class] << "select-user-delegate"
    end
    @builder.text_field(attribute_name, merged_input_options)
  end
end
