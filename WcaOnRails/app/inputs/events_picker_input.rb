# frozen_string_literal: true

class EventsPickerInput < SimpleForm::Inputs::Base
  CHECKED_VALUE = "1"
  UNCHECKED_VALUE = "0"

  def input(wrapper_options)
    merged_input_options = merge_wrapper_options(input_html_options, wrapper_options)

    allowed_events = @options[:allowed_events] || Event.official
    selected_events = @options[:selected_events] || [@options[:selected_event]].compact || []

    only_one = @options[:only_one].present? && @options[:only_one]
    include_all = @options[:include_all].present? && @options[:include_all]

    template.content_tag(:span) do
      element_class = only_one ? "event-radio" : "event-checkbox"

      if only_one && include_all
        checked_options = merged_input_options.merge(checked: selected_events.empty?)
        check_box = ActionView::Helpers::Tags::RadioButton.new(@builder.object_name, attribute_name, template, "all", checked_options)

        label_id = "#{check_box.send(:tag_id)}_all"

        template.concat(
          template.content_tag(
            :span,
            template.content_tag(
              :label,
              (
                check_box.render +
                  template.content_tag(:i, "", data: { toggle: "tooltip", placement: "top" }, title: 'ALL', class: "cubing-icon icon unofficial-miniguild")
              ),
              for: label_id,
            ),
            class: element_class + (merged_input_options[:disabled] ? " disabled" : ""),
          ),
        )
      end

      allowed_events.each do |event|
        checked_options = merged_input_options.merge(checked: selected_events.include?(event))

        check_box = if only_one
                      ActionView::Helpers::Tags::RadioButton.new(@builder.object_name, attribute_name, template, event.id, checked_options)
                    else
                      ActionView::Helpers::Tags::CheckBox.new("#{@builder.object_name}[#{attribute_name}]", event.id, template, CHECKED_VALUE, UNCHECKED_VALUE, checked_options)
                    end

        label_id = check_box.send(:tag_id)
        # quirk in the ActionView template lib that I'm not bothering to investigate because we're moving to React soon anyways.
        label_id += "_#{event.id}" if only_one

        template.concat(
          template.content_tag(
            :span,
            template.content_tag(
              :label,
              (
                check_box.render +
                  template.cubing_icon(event.id, data: { toggle: "tooltip", placement: "top" }, title: event.name)
              ),
              for: label_id,
            ),
            class: element_class + (merged_input_options[:disabled] ? " disabled" : ""),
          ),
        )
      end
    end
  end
end
