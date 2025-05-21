# frozen_string_literal: true

module AdvancementConditions
  class RankingCondition < AdvancementCondition
    alias_method :ranking, :level

    def self.wcif_type
      "ranking"
    end

    def to_s(_round, short: false)
      I18n.t("advancement_condition#{'.short' if short}.ranking", ranking: ranking)
    end

    def max_advancing(_results)
      ranking
    end
  end
end
