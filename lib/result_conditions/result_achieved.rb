# frozen_string_literal: true

module ResultConditions
  class ResultAchieved < ResultCondition
    attribute :scope, :string
    attribute :value, :integer

    validates :scope, inclusion: { in: %w[single average] }
    validates :value, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true

    def self.wcif_type
      "resultAchieved"
    end
  end
end
