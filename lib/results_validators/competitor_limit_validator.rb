# frozen_string_literal: true

module ResultsValidators
  class CompetitorLimitValidator < GenericValidator
    COMPETITOR_LIMIT_WARNING = :competitor_limit_exceeded_warning

    def self.description
      "For competition with a competitor limit, this validator checks that this limit is respected."
    end

    def self.automatically_fixable?
      false
    end

    def include_persons?
      true
    end

    def run_validation(validator_data)
      validator_data.each do |competition_data|
        competition = competition_data.competition

        competitor_limit = competition.competitor_limit
        total_competitors = competition_data.persons.length

        next unless competition.competitor_limit_enabled && total_competitors > competitor_limit

        @warnings << ValidationWarning.new(COMPETITOR_LIMIT_WARNING,
                                           :persons, competition.id,
                                           n_competitors: total_competitors,
                                           competitor_limit: competitor_limit)
      end

      self
    end
  end
end
