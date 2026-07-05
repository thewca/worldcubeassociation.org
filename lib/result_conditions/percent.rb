# frozen_string_literal: true

module ResultConditions
  class Percent < ResultCondition
    attribute :scope, :string
    attribute :value, :integer

    validates :scope, inclusion: { in: %w[single average] }
    validates :value, numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }

    def self.wcif_type
      "percent"
    end

    def to_s(_round, short: false)
      I18n.t("advancement_condition#{'.short' if short}.percent", percent: value)
    end

    def nominal_max_advancing(results)
      results.size * value / 100
    end
  end
end
