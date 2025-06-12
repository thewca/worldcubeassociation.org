# frozen_string_literal: true

module ResultsValidators
  class GenericValidator
    attr_reader :errors, :warnings, :infos

    def initialize
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

      def get_rounds_info(competition, round_ids_from_results)
        # Get rounds information from the competition, and detect a legitimate situation
        # where a round_id may be missing in the competition rounds: if it was a
        # cutoff round and everyone made the cutoff!
        # See additional comment here: https://github.com/thewca/worldcubeassociation.org/pull/4357#discussion_r307312177
        rounds_information = competition.competition_events.flat_map(&:rounds).index_by do |r|
          "#{r.event.id}-#{r.round_type_id}"
        end
        # Now try to "cast" a declared cutoff round to an existing non-cutoff round
        missing_round_ids = round_ids_from_results - rounds_information.keys
        extra_round_ids = rounds_information.keys - round_ids_from_results
        missing_round_ids.each do |round_id|
          event_id, round_type_id = round_id.split("-")
          equivalent_round_id = "#{event_id}-#{RoundType.toggle_cutoff(round_type_id)}"
          if extra_round_ids.delete(equivalent_round_id)
            equivalent_round = rounds_information[equivalent_round_id]
            rounds_information[round_id] = rounds_information.delete(equivalent_round_id) if equivalent_round.round_type.combined?
          end
        end
        rounds_information
      end
  end
end
