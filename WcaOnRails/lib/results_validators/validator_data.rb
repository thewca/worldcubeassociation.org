# frozen_string_literal: true

module ResultsValidators
  class ValidatorData
    include ActiveModel::Model

    attr_accessor :competition, :results, :persons

    def self.from_competitions(validator, competition_ids, check_real_results, batch_size: nil)
      associations = self.load_associations(validator, check_real_results: check_real_results)

      results_assoc = check_real_results ? :results : :inbox_results
      associations.deep_merge!({ results_assoc => [] })

      competition_scope = self.load_competition_includes(validator, associations)
                              .where(id: competition_ids)

      competition_scope = competition_scope.find_each(batch_size: batch_size) if batch_size.present?

      competition_scope.map do |model_competition|
        model_results = model_competition.send(results_assoc).sorted

        self.load_data(validator, model_competition, model_results, check_real_results: check_real_results)
      end
    end

    def self.from_results(validator, results)
      results.group_by(&:competitionId)
             .map do |competition_id, comp_results|
        # TODO: A bit hacky to check this, but fair given the assumptions of the previous default `validate` method.
        check_real_results = comp_results.any? { |r| r.is_a? Result }

        competition_scope = self.load_competition_includes(validator, check_real_results: check_real_results)
        model_competition = competition_scope.find(competition_id)

        self.load_data(validator, model_competition, comp_results, check_real_results: check_real_results)
      end
    end

    def self.load_associations(validator, check_real_results: false)
      associations = validator.competition_associations

      if validator.include_persons?
        persons_assoc = check_real_results ? :competitors : :inbox_persons
        associations.deep_merge!({ persons_assoc => [] })
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
      data = ResultsValidators::ValidatorData.new(
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
