# frozen_string_literal: true

class CompetitionIdInput < SimpleForm::Inputs::Base
  def input(wrapper_options)
    merged_input_options = merge_wrapper_options(input_html_options, wrapper_options)
    merged_input_options[:class] << "wca-autocomplete wca-autocomplete-competitions_search"
    if @options[:only_one]
      merged_input_options[:class] << "wca-autocomplete-only_one"
    end
    competitions = (@builder.object.send(attribute_name) || "").split(",").map do |id|
      if @options[:only_visible]
        Competition.visible.find_by_id(id)
      else
        Competition.find_by_id(id)
      end
    end
    merged_input_options[:data] = { data: competitions.compact.to_json }
    @builder.text_field(attribute_name, merged_input_options)
  end
end
