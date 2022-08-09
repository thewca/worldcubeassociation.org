# frozen_string_literal: true

module AdvancementConditions
  class AttemptResultCondition < AdvancementCondition
    alias_method :attempt_result, :level

    def self.wcif_type
      "attemptResult"
    end

    def to_s(round, short: false)
      round_form = I18n.t("formats#{".short" if short}.#{round.format_id}")
      if round.event.timed_event?
        I18n.t("advancement_condition#{".short" if short}.attempt_result.time", round_format: round_form, time: SolveTime.centiseconds_to_clock_format(attempt_result))
      elsif round.event.fewest_moves?
        I18n.t("advancement_condition#{".short" if short}.attempt_result.moves", round_format: round_form, moves: attempt_result)
      elsif round.event.multiple_blindfolded?
        I18n.t("advancement_condition#{".short" if short}.attempt_result.points", round_format: round_form, points: SolveTime.multibld_attempt_to_points(attempt_result))
      end
    end
  end
end
