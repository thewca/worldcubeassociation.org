# frozen_string_literal: true

module ResultsValidators
  class CompetitionsResultsValidator < GenericValidator
    @@desc = "This validator is an aggregate of an arbitrary set of other validators, running on an arbitrary set of competitions."

    def self.has_automated_fix?
      false
    end

    attr_reader :results, :persons, :validators

    # Takes a list of validator classes, and if it should process real results
    # or not.
    def initialize(validators: [], check_real_results: false, apply_fixes: false)
      super(apply_fixes: apply_fixes)
      # If no validator is given, assume we should apply all.
      @validators = validators
      @check_real_results = check_real_results
      @results = []
      @persons = []
    end

    def self.create_full_validation
      new(validators: ResultsValidators::Utils::ALL_VALIDATORS)
    end

    def check_real_results?
      @check_real_results
    end

    def has_results?
      @results.any?
    end

    def persons_by_id
      @persons_by_id ||= @persons.to_h { |person| [@check_real_results ? person.wca_id : person.id, person] }
    end

    # The concept: this aggregate of validators should be applicable on any association
    # of competitions/validators (eg: run all validations on a given competition,
    # validate the competitor limit for a given set of competitions).
    def validate(competition_ids = [])
      unless competition_ids.respond_to?(:each)
        competition_ids = [competition_ids]
      end
      result_model = @check_real_results ? Result : InboxResult
      # FIXME: aggregating this way prevent multiple loading of the data, and still
      # guarantees the overall validation is in O(n).
      # However we could reduce the constant by refactoring a bit the validators,
      # and making them work either on a result row or on the whole competition.
      # We should also share some of the data for all validators (rounds_by_id,
      # persons_by_id, and so on).
      # This is especially relevant for large competitions.
      @results = result_model.sorted_for_competitions(competition_ids)

      (competition_ids - @results.map(&:competitionId).uniq).each do |c|
        @errors << ValidationError.new(:results, c, "No results for the competition.")
      end

      @persons = if @check_real_results
                   Person.where(wca_id: @results.map(&:personId).uniq)
                 else
                   InboxPerson.where(competitionId: competition_ids)
                 end

      # Ensure any call to localizable name (eg: round names) is made in English,
      # as all errors and warnings are in English.
      I18n.with_locale(:en) do
        merge(@validators.map { |v| v.new(apply_fixes: @apply_fixes).validate(results: @results, model: result_model) })
      end
      self
    end

    private

      def merge(other_validators)
        unless other_validators.respond_to?(:each)
          other_validators = [other_validators]
        end
        other_validators.each do |v|
          @errors.concat(v.errors)
          @warnings.concat(v.warnings)
          @infos.concat(v.infos)
        end
      end
  end
end
