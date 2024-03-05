# frozen_string_literal: true

class DatePickerInput < SimpleForm::Inputs::StringInput
  def input(wrapper_options)
    set_html_options
    set_value_html_option

    template.content_tag :div, class: 'input-group date datetimepicker' do
      input = super(wrapper_options) # leave StringInput do the real rendering
      input + utc_addon
    end
  end

  def input_html_classes
    super.push '' # 'form-control'
  end

  def self.date_options_base
    {
      locale: I18n.locale.to_s,
      format: self.picker_pattern,
      dayViewHeaderFormat: DatePickerInput.date_view_header_format,
    }
  end

  def self.display_pattern
    I18n.t('datepicker.dformat')
  end

  def self.picker_pattern
    I18n.t('datepicker.pformat')
  end

  def self.date_view_header_format
    I18n.t('datepicker.dayViewHeaderFormat')
  end

  private

    def input_button
      template.content_tag :span, class: 'input-group-btn' do
        template.content_tag :button, class: 'btn btn-default', type: 'button' do
          template.content_tag :span, '', class: 'icon calendar'
        end
      end
    end

    def utc_addon
      ""
    end

    def set_html_options
      input_html_options[:type] = 'text'
      input_html_options[:autocomplete] = 'off'
      input_html_options[:data] ||= {}
      input_html_options[:data][:date_options] = date_options
      input_html_options[:placeholder] = input_placeholder
    end

    def set_value_html_option
      return unless value.present?
      input_html_options[:value] ||= value.is_a?(String) ? value : I18n.localize(value, format: self.class.display_pattern)
    end

    def value
      object.send(attribute_name) if object.respond_to? attribute_name
    end

    def date_options
      custom_options = input_html_options[:data][:date_options] || {}
      self.class.date_options_base.merge!(custom_options)
    end

    def input_placeholder
      I18n.t('common.date_placeholder')
    end
end
