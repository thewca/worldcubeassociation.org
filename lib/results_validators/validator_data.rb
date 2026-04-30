# frozen_string_literal: true

module ResultsValidators
  class ValidatorData
    include ActiveModel::Model

    BACKOFF_INT_MAX = 2_147_483_648

    attr_accessor :competition, :results, :persons, :scrambles

    def self.from_competitions(validator, competition_ids, check_real_results, batch_size: nil)
      associations = self.load_associations(validator, check_real_results: check_real_results)

      results_assoc = check_real_results ? :results : :inbox_results
      # Deliberately NOT sending :format and :event because those are cached values anyways
      associations.deep_merge!({ results_assoc => { round: [:competition_event] } })
      # TODO: Reconsider the `if` postfix once we have migrated away from inbox_results
      associations.deep_merge!({ results_assoc => { result_attempts: [] } }) if check_real_results

      competition_scope = self.load_competition_includes(validator, associations, check_real_results: check_real_results)
                              .where(id: competition_ids)

      competition_scope = competition_scope.find_each(batch_size: batch_size) if batch_size.present?

      competition_scope.map do |model_competition|
        model_results = model_competition.send(results_assoc)

        self.load_data(validator, model_competition, model_results, check_real_results: check_real_results)
      end
    end

    def self.from_results(validator, results, check_real_results)
      results.group_by(&:competition_id)
             .map do |competition_id, comp_results|
               competition_scope = self.load_competition_includes(validator, check_real_results: check_real_results)
               model_competition = competition_scope.find(competition_id)

               self.load_data(validator, model_competition, comp_results, check_real_results: check_real_results)
      end
    end

    def self.load_associations(validator, check_real_results: false)
      associations = validator.competition_associations(check_real_results: check_real_results)

      if validator.include_persons?
        persons_assoc = check_real_results ? :competitors : :inbox_persons
        assoc_models = check_real_results ? [] : [:person]

        associations.deep_merge!({ persons_assoc => assoc_models })
      end

      if validator.include_scrambles?
        scrambles_assoc = self.inbox_scrambles_assoc(check_real_results: check_real_results)

        associations.deep_merge!({ scrambles_assoc => [:round] })
      end

      associations
    end

    def self.load_competition_includes(validator, associations = nil, check_real_results: false)
      associations ||= self.load_associations(validator, check_real_results: check_real_results)

      competition_scope = Competition

      # Rails has an error message that complains about "The method .includes() must contain arguments."
      competition_scope = competition_scope.includes(**associations) unless associations.empty?

      competition_scope
    end

    def self.load_data(validator, competition, results, check_real_results: false)
      # We're sorting in-memory because it is cheaper to re-order an arbitrary Results array that was efficiently loaded by `Competition.includes`,
      # rather than firing a custom SQL ORDER BY that cannot be pre-loaded via `includes`. Bonus: We get to sort via rank and not pure ID.
      ordered_results = results.sort_by do |r|
        valid_average = %w[a m].include?(r.format_id) && r.average.positive?
        valid_best = r.best.positive?

        [
          r.event.rank,
          r.round_type.rank,
          valid_average ? r.average : BACKOFF_INT_MAX,
          valid_best ? r.best : BACKOFF_INT_MAX,
        ]
      end

      data = ResultsValidators::ValidatorData.new(
        competition: competition,
        results: ordered_results,
      )

      if validator.include_persons?
        data.persons = check_real_results ? competition.competitors : competition.inbox_persons
      end

      if validator.include_scrambles?
        scrambles_relation = self.inbox_scrambles_assoc(check_real_results: check_real_results)
        data.scrambles = competition.public_send(scrambles_relation)
      end

      data
    end

    def self.inbox_scrambles_assoc(check_real_results: false)
      if Rails.env.local?
        # CI tests can already run on the assumption that the split was fully executed
        return check_real_results ? :scrambles : :matched_scrambles
      end

      # During the migration of scramble tables, there might be some ongoing postings
      #   that are still relying on the old table structures.
      # To enable a smooth migration, we temporarily pretend that all posting procedures
      #   follow the "old" way of doing things, where the productive `scrambles` table was just hard-wired.
      #   In around ~3 days from this comment, when all results postings are newer than the deploy(!) date of this comment,
      #   we can switch safely to running the validators on `matched_scrambles` even in production.
      :scrambles
    end
  end
end
