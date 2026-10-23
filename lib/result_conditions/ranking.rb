# frozen_string_literal: true

module ResultConditions
  class Ranking < ResultCondition
    attribute :scope, :string
    attribute :value, :integer

    validates :scope, inclusion: { in: %w[single average] }
    validates :value, numericality: { only_integer: true, greater_than_or_equal_to: 1 }

    def self.wcif_type
      "ranking"
    end

    def to_s(_round, short: false)
      I18n.t("advancement_condition#{'.short' if short}.ranking", ranking: value)
    end

    def nominal_max_advancing(_results)
      value
    end
  end
end
