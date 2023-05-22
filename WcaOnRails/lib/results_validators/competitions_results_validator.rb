# frozen_string_literal: true

module ResultsValidators
  class CompetitionsResultsValidator < GenericValidator
    @desc = "This validator is an aggregate of an arbitrary set of other validators, running on an arbitrary set of competitions."

    def self.has_automated_fix?
      false
    end

    attr_reader :results, :persons, :validators

    # Takes a list of validator classes, and if it should process real results or not.
    def initialize(validators = [], check_real_results: false, apply_fixes: false, sql_batch: nil, memory_batch: nil)
      super(apply_fixes: apply_fixes)

      @validators = validators

      @check_real_results = check_real_results

      @sql_batch = sql_batch
      @memory_batch = memory_batch

      @results = []
      @persons = []
    end

    def self.create_full_validation
      new(ResultsValidators::Utils::ALL_VALIDATORS)
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
      @validators.map { |v| self.load_validator v }
                 .map(&:competition_associations)
                 .inject({}, :deep_merge) # default {} value for the rare case that @validators is empty.
    end

    def include_persons?
      true
    end

    protected def validate_competitions(competition_ids, check_real_results)
      if @memory_batch.present?
        competition_ids.each_slice(@memory_batch) do |batch_ids|
          validator_data = ValidatorData.from_competitions(self, batch_ids, check_real_results)

          run_validation(validator_data)
        end
      else
        validator_data = ValidatorData.from_competitions(self, competition_ids, check_real_results, batch_size: @sql_batch)

        run_validation(validator_data)
      end
    end

    # The concept: this aggregate of validators should be applicable on any association
    # of competitions/validators (eg: run all validations on a given competition,
    # validate the competitor limit for a given set of competitions).
    def run_validation(validator_data)
      validator_data.each do |competition_data|
        @results += competition_data.results
        @persons += competition_data.persons
      end

      # Ensure any call to localizable name (eg: round names) is made in English,
      # as all errors and warnings are in English.
      I18n.with_locale(:en) do
        @validators.each do |validator_class|
          validator = self.load_validator(validator_class)
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

      def load_validator(validator_class)
        validator_class.new(apply_fixes: @apply_fixes)
      end

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
