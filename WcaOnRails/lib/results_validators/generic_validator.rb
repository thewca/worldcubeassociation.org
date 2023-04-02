# frozen_string_literal: true

module ResultsValidators
  class GenericValidator
    attr_reader :errors, :warnings, :infos, :apply_fixes

    @@desc = "Please override that class variable with a proper description when you inherit the class."

    def initialize(apply_fixes: false)
      @apply_fixes = apply_fixes
      reset_state
    end

    def has_errors?
      @errors.any?
    end

    def has_warnings?
      @warnings.any?
    end

    def has_infos?
      @infos.any?
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

    def self.class_name
      self.name.split('::').last
    end

    def self.serialize
      {
        name: class_name,
      }
    end

    private

      def reset_state
        @errors = []
        @warnings = []
        @infos = []
      end

    protected

      def get_rounds_info(competition, round_ids_from_results)
        # Get rounds information from the competition, and detect a legitimate situation
        # where a round_id may be missing in the competition rounds: if it was a
        # cutoff round and everyone made the cutoff!
        # See additional comment here: https://github.com/thewca/worldcubeassociation.org/pull/4357#discussion_r307312177
        rounds_information = competition.competition_events.flat_map(&:rounds).to_h do |r|
          ["#{r.event.id}-#{r.round_type_id}", r]
        end
        # Now try to "cast" a declared cutoff round to an existing non-cutoff round
        missing_round_ids = round_ids_from_results - rounds_information.keys
        extra_round_ids = rounds_information.keys - round_ids_from_results
        missing_round_ids.each do |round_id|
          event_id, round_type_id = round_id.split("-")
          equivalent_round_id = "#{event_id}-#{RoundType.toggle_cutoff(round_type_id)}"
          if extra_round_ids.delete(equivalent_round_id)
            equivalent_round = rounds_information[equivalent_round_id]
            if equivalent_round.round_type.combined?
              rounds_information[round_id] = rounds_information.delete(equivalent_round_id)
            end
          end
        end
        rounds_information
      end
  end
end
