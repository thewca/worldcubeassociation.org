# frozen_string_literal: true

class EventsPickerInput < SimpleForm::Inputs::Base
  def input(wrapper_options)
    merged_input_options = merge_wrapper_options(input_html_options, wrapper_options)

    allowed_events = @options[:allowed_events]
    selected_events = @options[:selected_events]
    template.content_tag(:span) do
      allowed_events.each do |event|
        checked_value = "1"
        unchecked_value = "0"
        check_box = ActionView::Helpers::Tags::CheckBox.new("#{@builder.object_name}[#{attribute_name}]", event.id, template, checked_value, unchecked_value, merged_input_options.merge(checked: selected_events.include?(event)))
        template.concat(
          template.content_tag(
            :span,
            template.content_tag(
              :label,
              (
                check_box.render +
                template.content_tag(:span, "", class: "cubing-icon event-#{event.id}", data: { toggle: "tooltip", placement: "top" }, title: event.name)
              ),
              for: check_box.send(:tag_id),
            ),
            class: "event-checkbox" + (merged_input_options[:disabled] ? " disabled" : ""),
          ),
        )
      end
    end
  end
end
