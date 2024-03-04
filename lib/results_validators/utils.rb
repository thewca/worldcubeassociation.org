# frozen_string_literal: true

module ResultsValidators
  module Utils
    ALL_VALIDATORS = [
      AdvancementConditionsValidator,
      CompetitorLimitValidator,
      EventsRoundsValidator,
      IndividualResultsValidator,
      PersonsValidator,
      PositionsValidator,
      ScramblesValidator,
    ].freeze

    VALIDATORS_WITH_FIX = ALL_VALIDATORS.select(&:has_automated_fix?).freeze

    def self.validator_class_from_name(name)
      ALL_VALIDATORS.find { |v| v.class_name == name }
    end
  end
end
