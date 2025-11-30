# frozen_string_literal: true

module AdvancementConditions
  module Utils
    ALL_ADVANCEMENT_CONDITIONS = [
      AttemptResultCondition,
      PercentCondition,
      RankingCondition,
      LinkedRoundCondition,
    ].freeze

    def self.advancement_condition_class_from_wcif_type(wcif_type)
      ALL_ADVANCEMENT_CONDITIONS.find { |v| v.wcif_type == wcif_type }
    end
  end
end
