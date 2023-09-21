# frozen_string_literal: true

module ResultsValidators
  class CompetitorLimitValidator < GenericValidator
    COMPETITOR_LIMIT_WARNING = "The number of persons in the competition (%{n_competitors}) is above the competitor limit (%{competitor_limit}). " \
                               "The results of the competitors registered after the competitor limit was reached must be removed."

    @desc = "For competition with a competitor limit, this validator checks that this limit is respected."

    def self.has_automated_fix?
      false
    end

    def include_persons?
      true
    end

    def run_validation(validator_data)
      validator_data.each do |competition_data|
        competition = competition_data.competition

        competitor_limit = competition.competitor_limit
        total_competitors = competition_data.persons.count

        if competition.competitor_limit_enabled && total_competitors > competitor_limit
          @warnings << ValidationWarning.new(:persons, competition.id,
                                             COMPETITOR_LIMIT_WARNING,
                                             n_competitors: total_competitors,
                                             competitor_limit: competitor_limit)
        end
      end

      self
    end
  end
end
