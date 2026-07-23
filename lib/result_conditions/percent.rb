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

    def max_advancing(results)
      valid_results = results.count { |r| r.best.positive? }
      proceeds = results.size * value / 100
      [valid_results, proceeds].min
    end
  end
end
