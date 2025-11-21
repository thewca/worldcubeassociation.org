# frozen_string_literal: true

module ResultsValidators
  class GenericValidator
    attr_reader :errors, :warnings, :infos, :apply_fixes

    def initialize(apply_fixes: false)
      @apply_fixes = apply_fixes
      reset_state
    end

    def any_errors?
      @errors.any?
    end

    def any_warnings?
      @warnings.any?
    end

    def any_infos?
      @infos.any?
    end

    # User must provide either:
    #   - 'competition_ids' and 'model' (Result | InboxResult)
    #   - 'results'
    def validate(competition_ids: [], model: Result, results: nil)
      self.reset_state

      if results.present?
        validator_data = ValidatorData.from_results(self, results)

        run_validation(validator_data)
      end

      if competition_ids.present?
        competition_ids = [competition_ids] unless competition_ids.respond_to? :each

        check_real_results = model == Result

        self.validate_competitions(competition_ids, check_real_results)
      end

      self
    end

    def run_validation(validator_data)
      raise NotImplementedError
    end

    def self.description
      raise "Please override that class variable with a proper description when you inherit the class."
    end

    def self.class_name
      self.name.demodulize
    end

    def self.serialize
      {
        name: class_name,
      }
    end

    def competition_associations
      {}
    end

    def include_persons?
      false
    end

    private

      def reset_state
        @errors = []
        @warnings = []
        @infos = []
      end

    protected

      def validate_competitions(competition_ids, check_real_results)
        validator_data = ValidatorData.from_competitions(self, competition_ids, check_real_results)

        run_validation(validator_data)
      end
  end
end
