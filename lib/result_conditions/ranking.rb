# frozen_string_literal: true

module ResultConditions
  class Ranking < ResultCondition
    validates :value, numericality: { only_integer: true, greater_than_or_equal_to: 1 }

    def self.wcif_type
      "ranking"
    end

    def to_desc(_source, short: false)
      I18n.t("advancement_condition#{'.short' if short}.ranking", ranking: self.value)
    end

    def max_advancing(_results)
      value
    end
  end
end
