# frozen_string_literal: true

class ResultValidationForm
  ALL_VALIDATOR_NAMES = ResultsValidators::Utils::ALL_VALIDATORS.map(&:class_name)
  VALIDATOR_WITH_FIX_NAMES = ResultsValidators::Utils::VALIDATORS_WITH_FIX.map(&:class_name)

  COMP_VALIDATION_ALL = :all
  COMP_VALIDATION_MANUAL = :manual

  COMP_VALIDATION_MODES = [["Pick competition(s) manually", COMP_VALIDATION_MANUAL], ["Execute for ALL competitions", COMP_VALIDATION_ALL]].freeze

  include ActiveModel::Model

  attr_accessor :validator_classes, :competition_ids
  attr_writer :apply_fixes, :competition_selection

  def competitions
    if @competition_selection == COMP_VALIDATION_ALL.to_s
      Competition.over.not_cancelled.ids
    else
      @competition_ids.split(",").uniq.compact
    end
  end

  def competition_selection
    @competition_selection || COMP_VALIDATION_MANUAL
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
