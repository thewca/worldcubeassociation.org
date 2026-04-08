# frozen_string_literal: true

module ResultConditions
  module Utils
    ALL_RESULT_CONDITIONS = [
      ResultAchieved,
      Ranking,
      Percent,
    ].freeze

    def self.result_condition_class_from_wcif_type(wcif_type)
      ALL_RESULT_CONDITIONS.find { it.wcif_type == wcif_type }
    end

    def self.upcycle_advancement_condition(advancement_condition, round)
      return if advancement_condition.blank?

      case advancement_condition.class.wcif_type
      when 'attemptResult'
        ResultAchieved.new(scope: round.format.sort_by, value: advancement_condition.level)
      when 'percent'
        Percent.new(value: advancement_condition.level)
      when 'ranking'
        Ranking.new(value: advancement_condition.level)
      end
    end
  end
end
