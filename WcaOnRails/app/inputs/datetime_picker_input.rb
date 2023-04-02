# frozen_string_literal: true

class DatetimePickerInput < DatePickerInput
  def self.display_pattern
    I18n.t('datepicker.dformat') + ' ' + I18n.t('timepicker.dformat')
  end

  def self.picker_pattern
    I18n.t('datepicker.pformat') + ' ' + I18n.t('timepicker.pformat')
  end

  private

    def utc_addon
      template.content_tag :span, "UTC", class: "input-group-addon"
    end

    def input_placeholder
      I18n.t('common.datetime_placeholder')
    end
end
