# frozen_string_literal: true

module ResultConditions
  class Percent < ResultCondition
    attribute :value, :integer

    validates :value, numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }

    def self.wcif_type
      "percent"
    end
  end
end
