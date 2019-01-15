# frozen_string_literal: true

module ResultsSubmissionHelper
  def class_for_panel(error:, warning:)
    if error
      "danger"
    elsif warning
      "warning"
    else
      "success"
    end
  end
end
