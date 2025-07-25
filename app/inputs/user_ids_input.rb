# frozen_string_literal: true

class UserIdsInput < SimpleForm::Inputs::Base
  def input(wrapper_options)
    merged_input_options = merge_wrapper_options(input_html_options, wrapper_options)
    merged_input_options[:class] << "wca-autocomplete wca-autocomplete-users_search"
    merged_input_options[:class] << "wca-autocomplete-only_staff_delegates" if @options[:only_staff_delegates]
    merged_input_options[:class] << "wca-autocomplete-only_trainee_delegates" if @options[:only_trainee_delegates]
    if @options[:persons_table]
      merged_input_options[:class] << "wca-autocomplete-persons_table"
      persons = (@builder.object.send(attribute_name) || "").split(",").map { |wca_id| Person.find_by(wca_id: wca_id) }
      merged_input_options[:data] = { data: persons.to_json }
    else
      users = @builder.object.send(attribute_name).to_s.split(",").map { |id| User.find_by(id: id) }
      merged_input_options[:data] = { data: users.to_json }
    end
    merged_input_options[:class] << "wca-autocomplete-only_one" if @options[:only_one]
    @builder.text_field(attribute_name, merged_input_options)
  end
end
