# frozen_string_literal: true

module AdminHelper
  def apply_fixes_label
    "Apply fix when possible"
  end

  def apply_fixes_hint
    "List of validators with automated fix: #{ResultsValidators::Utils::VALIDATORS_WITH_FIX.map(&:class_name).join(",")}."
  end
end
