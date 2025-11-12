# frozen_string_literal: true

module AdvancementConditions
  class DualRoundCondition < AdvancementCondition
    def self.wcif_type
      "dual"
    end

    def to_s(_round, short: false)
      I18n.t("advancement_condition#{'.short' if short}.dual")
    end

    # No one "advances" to the linked round of a dual round
    # so these are ignored in an advancing check,
    # instead the results of all linked rounds are merged
    # and the advancement condition of the last round is applied
    def max_advancing(_results)
      0
    end
  end
end
