# frozen_string_literal: true

class ResultValidationForm
  ALL_VALIDATOR_NAMES = ResultsValidators::Utils::ALL_VALIDATORS.map(&:class_name)
  VALIDATOR_WITH_FIX_NAMES = ResultsValidators::Utils::VALIDATORS_WITH_FIX.map(&:class_name)

  COMP_VALIDATION_ALL = :all
  COMP_VALIDATION_MANUAL = :manual

  COMP_VALIDATION_MODES = [["Pick competition(s) manually", COMP_VALIDATION_MANUAL], ["Execute for ALL competitions", COMP_VALIDATION_ALL]].freeze

  ALL_COMPETITIONS_SCOPE = Competition.over.not_cancelled
  ALL_COMPETITIONS_MAX = 500

  include ActiveModel::Model

  attr_accessor :validator_classes, :competition_ids
  attr_writer :apply_fixes, :competition_selection, :competition_start_date

  validates :competition_ids, presence: true, if: -> { self.competition_selection == COMP_VALIDATION_MANUAL }
  validates :competition_start_date, presence: true, if: -> { self.competition_selection == COMP_VALIDATION_ALL }

  def competitions
    if self.competition_selection == COMP_VALIDATION_ALL
      ALL_COMPETITIONS_SCOPE.where("start_date >= ?", self.competition_start_date)
                            .where("end_date <= ?", self.competition_end_date)
                            .ids
    else
      @competition_ids.split(",").uniq.compact
    end
  end

  def competition_selection
    @competition_selection.to_sym || COMP_VALIDATION_MANUAL
  end

  def competition_start_date
    Date.parse(@competition_start_date) if @competition_start_date.present?
  end

  def competition_end_date
    ResultValidationForm.compute_end_date(self.competition_start_date) if self.competition_start_date.present?
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
    build_validator.validate competitions
  end

  def self.compute_end_date(start_date)
    end_date = ALL_COMPETITIONS_SCOPE.where("start_date >= ?", start_date)
                                     .order(:start_date)
                                     # Not using `offset` because of the risk to skip into nothingness for newer competitions
                                     .limit(ALL_COMPETITIONS_MAX)
                                     .pluck(:end_date)
                                     .last

    return start_date if end_date.nil?

    self.cap_range(start_date, end_date)
  end

  def self.cap_range(start_date, end_date)
    if end_date < start_date
      return start_date
    end

    limit_count = ALL_COMPETITIONS_SCOPE.where("start_date >= ?", start_date)
                                        .where("end_date <= ?", end_date)
                                        .count

    if limit_count > ALL_COMPETITIONS_MAX
      return self.cap_range(start_date, end_date - 1.day)
    end

    end_date
  end
end
