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
  attr_writer :apply_fixes, :competition_selection, :competition_start_date, :competition_end_date

  validates :competition_ids, presence: true, if: -> { self.competition_selection == COMP_VALIDATION_MANUAL }

  validates :competition_start_date, presence: true, if: -> { self.competition_selection == COMP_VALIDATION_ALL }
  validates :competition_end_date, presence: true, if: -> { self.competition_selection == COMP_VALIDATION_ALL }

  validate :competition_count_within_bounds, :competition_range_overlapping

  def competition_count_within_bounds
    if competition_selection == COMP_VALIDATION_ALL && competition_range_count > ALL_COMPETITIONS_MAX
      range_end_date = ResultValidationForm.compute_range_end(self.competition_start_date)
      errors.add(:competition_range_count, "You are only allowed to select up to #{ALL_COMPETITIONS_MAX} at once! Suggested end date is #{range_end_date}")
    end
  end

  def competition_range_overlapping
    if competition_selection == COMP_VALIDATION_ALL
      if competition_start_date > competition_end_date
        errors.add(:competition_start_date, "The start date must be before the end date!")
      end

      if competition_start_date > Date.today
        errors.add(:competition_start_date, "The start date must not be in the future!")
      end
    end
  end

  def competitions
    if self.competition_selection == COMP_VALIDATION_ALL
      ResultValidationForm.competitions_between(self.competition_start_date, self.competition_end_date)
                          .order(:start_date)
                          .ids
    else
      @competition_ids.split(",").uniq.compact
    end
  end

  def competition_selection
    @competition_selection&.to_sym || COMP_VALIDATION_MANUAL
  end

  def competition_start_date
    Date.parse(@competition_start_date) if @competition_start_date.present?
  end

  def competition_end_date
    Date.parse(@competition_end_date) if @competition_end_date.present?
  end

  def competition_range_count
    ResultValidationForm.competitions_between(competition_start_date, competition_end_date).count
  end

  def validators
    @validator_classes.split(",").map { |v| ResultsValidators::Utils.validator_class_from_name(v) }.compact
  end

  def apply_fixes
    ActiveModel::Type::Boolean.new.cast(@apply_fixes)
  end

  def build_validator
    ResultsValidators::CompetitionsResultsValidator.new(
      validators,
      check_real_results: true,
      apply_fixes: apply_fixes,
    )
  end

  def build_and_run
    build_validator.validate competitions
  end

  def self.compute_range_end(start_date, count = ALL_COMPETITIONS_MAX)
    range_end = ALL_COMPETITIONS_SCOPE.where(start_date: start_date..)
                                      .order(:start_date)
                                      # Not using `offset` because of the risk to skip into nothingness for newer competitions
                                      .limit(count)
                                      .pluck(:start_date)
                                      .last

    return start_date if range_end.nil?

    self.cap_range(start_date, range_end, count)
  end

  def self.cap_range(start_date, range_end, max_count)
    if range_end < start_date
      return start_date
    end

    actual_count = self.competitions_between(start_date, range_end).count

    if actual_count > max_count
      return self.cap_range(start_date, range_end - 1.day, max_count)
    end

    range_end
  end

  def self.competitions_between(range_start, range_end)
    ALL_COMPETITIONS_SCOPE.where(start_date: range_start..)
                          .where(start_date: ..range_end)
  end
end
