# frozen_string_literal: true

module ResultConditions
  class ResultAchieved < ResultCondition
    attribute :scope, :string
    attribute :value, :integer

    validates :scope, inclusion: { in: %w[single average] }
    validates :value, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true

    def self.wcif_type
      "resultAchieved"
    end

    def to_s(round, short: false)
      round_form = I18n.t("formats#{'.short' if short}.#{round.format_id}")
      if round.event.timed_event?
        I18n.t("advancement_condition#{'.short' if short}.attempt_result.time", round_format: round_form, time: SolveTime.centiseconds_to_clock_format(value))
      elsif round.event.fewest_moves?
        I18n.t("advancement_condition#{'.short' if short}.attempt_result.moves", round_format: round_form, moves: value)
      elsif round.event.multiple_blindfolded?
        I18n.t("advancement_condition#{'.short' if short}.attempt_result.points", round_format: round_form, points: SolveTime.multibld_attempt_to_points(value))
      end
    end

    def nominal_max_advancing(results)
      return 0 if results.empty?

      # We store 'single' and 'average' as a reference to sort-by,
      #   but when dealing with results a single is stored as 'best'
      result_field = self.scope == "single" ? :best : scope.to_sym

      results.count do |r|
        r.to_solve_time(result_field).complete? && r.send(result_field) < value
      end
    end
  end
end
