# frozen_string_literal: true

module ResultsSubmissionHelper
  def class_for_panel(error:, warning:, no_validator: false)
    if error
      "danger"
    elsif warning || no_validator
      "warning"
    else
      "success"
    end
  end
end
