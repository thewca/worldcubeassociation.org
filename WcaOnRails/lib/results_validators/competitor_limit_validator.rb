# frozen_string_literal: true

module ResultsValidators
  class CompetitorLimitValidator < GenericValidator
    COMPETITOR_LIMIT_WARNING = "The number of persons in the competition (%{n_competitors}) is above the competitor limit (%{competitor_limit})."\
      " Unless a specific agreement was made when announcing the competition (such as a per-day competitor limit), the results of the competitors registered after the competitor limit was reached must be removed."

    @@desc = "For competition with a competitor limit, this validator checks that this limit is respected."

    def validate(competition_ids: [], model: Result, results: nil)
      reset_state

      if competition_ids.empty?
        competition_ids = results.map(&:competitionId).uniq
      end

      Competition.where(id: competition_ids, competitor_limit_enabled: true).each do |competition|
        limit = competition.competitor_limit
        total_competitors = if model == Result
                              competition.competitors.count
                            else
                              InboxPerson.where(competitionId: competition.id).count
                            end
        if total_competitors > limit
          @warnings << ValidationWarning.new(:persons, competition.id,
                                             COMPETITOR_LIMIT_WARNING,
                                             n_competitors: total_competitors,
                                             competitor_limit: limit)
        end
      end

      self
    end
  end
end
