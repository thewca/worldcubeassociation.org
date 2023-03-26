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
      @persons_by_id ||= @persons.index_by { |person| person.ref_id }
    end

    def competition_associations
      @validators.map(&:competition_associations)
                 .inject(:deep_merge)
    end

    def include_persons?
      true
    end

    protected def validate_competitions(competition_ids, check_real_results: true)
      competition_ids.each do |competition_id|
        validator_data = ValidatorData.from_competition(self, competition_id, check_real_results: check_real_results)

        # Intentionally run after every competition to avoid loading all competitions into memory at once.
        run_validation([validator_data])
      end
    end

    # The concept: this aggregate of validators should be applicable on any association
    # of competitions/validators (eg: run all validations on a given competition,
    # validate the competitor limit for a given set of competitions).
    protected def run_validation(validator_data)
      validator_data.each do |competition_data|
        @results += competition_data.results
        @persons += competition_data.persons
      end

      # Ensure any call to localizable name (eg: round names) is made in English,
      # as all errors and warnings are in English.
      I18n.with_locale(:en) do
        @validators.each do |validator_class|
          validator = validator_class.new(apply_fixes: @apply_fixes)
          validator.run_validation(validator_data)

          merge(validator)
        end
      end
    end

    def validate(competition_ids = [])
      result_model = @check_real_results ? Result : InboxResult
      super(competition_ids: competition_ids, model: result_model)
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
