class DatetimePickerInput < DatePickerInput
  private

  def display_pattern
    I18n.t('datepicker.dformat') + ' ' +
        I18n.t('timepicker.dformat')
  end

  def picker_pattern
    I18n.t('datepicker.pformat') + ' ' +
        I18n.t('timepicker.pformat')
  end

  def utc_addon
    template.content_tag :span, "UTC", class: "input-group-addon"
  end
end
