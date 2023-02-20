# frozen_string_literal: true

class ResultValidationForm
  ALL_VALIDATOR_NAMES = ResultsValidators::Utils::ALL_VALIDATORS.map(&:class_name)
  VALIDATOR_WITH_FIX_NAMES = ResultsValidators::Utils::VALIDATORS_WITH_FIX.map(&:class_name)

  include ActiveModel::Model

  attr_accessor :validator_classes, :competition_ids
  attr_writer :apply_fixes

  def competitions
    @competition_ids.split(",").uniq.compact
  end

  def validators
    @validator_classes.split(",").map { |v| ResultsValidators::Utils.validator_class_from_name(v) }.compact
  end

  def apply_fixes
    ActiveModel::Type::Boolean.new.cast(@apply_fixes)
  end

  def build_validator
    ResultsValidators::CompetitionsResultsValidator.new(
      check_real_results: true,
      validators: validators,
      apply_fixes: apply_fixes,
    )
  end

  def build_and_run
    build_validator.tap { |v| v.validate competitions }
  end
end
