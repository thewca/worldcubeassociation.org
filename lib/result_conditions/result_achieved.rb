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

    def max_advancing(results)
      return 0 if results.empty?

      # We store 'single' and 'average' as a reference to sort-by,
      #   but when dealing with results a single is stored as 'best'
      result_field = self.scope == "single" ? :best : scope.to_sym

      results.count do |r|
        r.to_solve_time(result_field).complete? && r.send(result_field) < value
      end
    end
  end
end
