# frozen_string_literal: true

module ResultsValidators
  class GenericValidator
    attr_reader :errors, :warnings
    @@desc = "Please override that class variable with a proper description when you inherit the class."

    def initialize
      reset_state
    end

    def has_errors?
      @errors.any?
    end

    def has_warnings?
      @warnings.any?
    end

    # User must provide either:
    #   - 'competition_ids' and 'model' (Result | InboxResult)
    #   - 'results'
    def validate(competition_ids: [], model: Result, results: nil)
      raise NotImplementedError
    end

    def description
      @@desc
    end

    private

    def reset_state
      @errors = []
      @warnings = []
    end

    protected

    # FIXME: this is kind of a helper that will be needed in several validators as well as in specs.
    # Where does it belong?
    def name_from_result(result)
      if result.respond_to?(:personName)
        result.personName
      else
        InboxPerson.find_by(id: result.personId)&.name || "<personId=#{result.personId}>"
      end
    end
  end
end
