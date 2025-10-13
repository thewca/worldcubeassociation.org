# frozen_string_literal: true

module AdvancementConditions
  class PercentCondition < AdvancementCondition
    alias_method :percent, :level

    def self.wcif_type
      "percent"
    end

    def to_s(_round, short: false)
      I18n.t("advancement_condition#{'.short' if short}.percent", percent: percent)
    end

    def max_advancing(results)
      valid_results = results.count { |r| r.best.positive? }
      proceeds = results.size * percent / 100
      [valid_results, proceeds].min
    end
  end
end
