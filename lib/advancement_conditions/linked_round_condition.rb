# frozen_string_literal: true

module AdvancementConditions
  class LinkedRoundCondition < AdvancementCondition

    attr_accessor :nested_advancement_condition, :linked_round_ids

    def initialize(nested_advancement_condition, linked_round_ids)
      self.nested_advancement_condition = nested_advancement_condition
      self.linked_round_ids = linked_round_ids
      self.level = nested_advancement_condition.level
    end

    def self.wcif_type
      "dual"
    end

    def to_s(_round, short: false)
      I18n.t("advancement_condition#{'.short' if short}.dual")
    end

    def max_advancing(results)
      nested_advancement_condition.max_advancing(results)
    end
  end
end
