# frozen_string_literal: true

module AdvancementConditions
  class DualRoundCondition < AdvancementCondition
    def self.wcif_type
      "dual"
    end

    def to_s(_round, short: false)
      I18n.t("advancement_condition#{'.short' if short}.dual")
    end

    def max_advancing(results)
      results.count
    end
  end
end
