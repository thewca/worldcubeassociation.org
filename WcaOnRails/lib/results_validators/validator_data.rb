# frozen_string_literal: true

module ResultsValidators
  class ValidatorData
    include ActiveModel::Model

    attr_reader :competition, :results
    attr_accessor :persons

    def self.from_competition(validator, competition_id, check_real_results: true)
      associations = self.load_associations(validator)

      results_assoc = check_real_results ? :results : :inbox_results
      associations.deep_merge!({ results_assoc => [] })

      model_competition = self.load_competition(validator, competition_id, associations)
      model_results = model_competition.send(results_assoc).sorted

      self.load_data(validator, model_competition, model_results, check_real_results: check_real_results)
    end

    def self.from_results(validator, results)
      results.group_by(&:competitionId)
             .map do |competition_id, comp_results|
        # TODO: A bit hacky to check this, but fair given the assumptions of the previous default `validate` method.
        check_real_results = comp_results.any? { |r| r.is_a? Result }

        model_competition = self.load_competition(validator, competition_id, check_real_results: check_real_results)

        self.load_data(validator, model_competition, comp_results, check_real_results: check_real_results)
      end
    end

    private

    def load_associations(validator, check_real_results: false)
      associations = validator.competition_associations

      if validator.include_persons?
        persons_assoc = check_real_results ? :competitors : :inbox_persons
        associations.deep_merge!({ persons_assoc => [] })
      end

      associations
    end

    def load_competition(validator, competition_id, associations = nil, check_real_results: false)
      associations ||= self.load_associations(validator, check_real_results: check_real_results)

      where_filters = validator.competition_where_filters

      Competition.includes(**associations)
                 .where(**where_filters)
                 .find(competition_id)
    end

    def load_data(validator, competition, results, check_real_results: false)
      data = self.new(
        competition: competition,
        results: results,
      )

      if validator.include_persons?
        data.persons = check_real_results ? competition.competitors : competition.inbox_persons
      end

      data
    end
  end
end
