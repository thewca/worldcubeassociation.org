# frozen_string_literal: true

class EventsPickerInput < SimpleForm::Inputs::Base
  CHECKED_VALUE = "1"
  UNCHECKED_VALUE = "0"

  def input(wrapper_options)
    merged_input_options = merge_wrapper_options(input_html_options, wrapper_options)

    allowed_events = @options[:allowed_events] || Event.official
    selected_events = @options[:selected_events] || [@options[:selected_event]].compact.presence || [@builder.object.send(attribute_name)].compact.presence || []

    only_one = @options[:only_one].present? && @options[:only_one]
    include_all = @options[:include_all].present? && @options[:include_all]

    template.content_tag(:p) do
      if include_all
        icon = template.unofficial_cubing_icon('miniguild', data: { toggle: "tooltip", placement: "top" }, title: 'All events')
        selected = selected_events.empty? || (selected_events.length == 1 && selected_events.first == 'all')

        add_input_field(only_one, 'all', icon, merged_input_options, selected: selected)
      end

      allowed_events.each do |event|
        icon = template.cubing_icon(event.id, data: { toggle: "tooltip", placement: "top" }, title: event.name)
        selected = selected_events.include?(event.id)

        add_input_field(only_one, event.id, icon, merged_input_options, selected: selected)
      end
    end
  end

  def add_input_field(only_one, id, icon, input_options, selected: false)
    element_class = only_one ? "event-radio" : "event-checkbox"
    checked_options = input_options.merge(checked: selected)

    check_box = if only_one
                  ActionView::Helpers::Tags::RadioButton.new(@builder.object_name, attribute_name, template, id, checked_options)
                else
                  ActionView::Helpers::Tags::CheckBox.new("#{@builder.object_name}[#{attribute_name}]", id, template, CHECKED_VALUE, UNCHECKED_VALUE, checked_options)
                end

    label_id = check_box.send(:tag_id)
    # quirk in the ActionView template lib that I'm not bothering to investigate because we're moving to React soon anyways.
    label_id += "_#{id}" if only_one

    template.concat(
      template.content_tag(
        :span,
        template.content_tag(
          :label,
          check_box.render + icon,
          for: label_id,
        ),
        class: element_class + (input_options[:disabled] ? " disabled" : ""),
      ),
    )
  end
end
