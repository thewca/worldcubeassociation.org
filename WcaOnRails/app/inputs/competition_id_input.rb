# frozen_string_literal: true

class CompetitionIdInput < SimpleForm::Inputs::Base
  def input(wrapper_options)
    merged_input_options = merge_wrapper_options(input_html_options, wrapper_options)
    merged_input_options[:class] << "wca-autocomplete wca-autocomplete-competitions_search"
    if @options[:only_one]
      merged_input_options[:class] << "wca-autocomplete-only_one"
    end
    unless @options[:no_query_injection]
      competitions = (@builder.object.send(attribute_name) || "").split(",").map { |id| Competition.find_by_id(id) }
      merged_input_options[:data] = { data: competitions.to_json }
    end
    @builder.text_field(attribute_name, merged_input_options)
  end
end
