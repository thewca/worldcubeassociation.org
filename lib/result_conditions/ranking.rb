# frozen_string_literal: true

module ResultConditions
  class Ranking < ResultCondition
    attribute :value, :integer

    validates :value, numericality: { only_integer: true, greater_than_or_equal_to: 1 }

    def self.wcif_type
      "ranking"
    end
  end
end
