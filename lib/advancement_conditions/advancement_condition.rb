# frozen_string_literal: true

module AdvancementConditions
  class AdvancementCondition
    include ActiveModel::Validations

    attr_accessor :level

    validates :level, numericality: { only_integer: true }

    def initialize(level)
      self.level = level
    end

    def to_wcif
      { "type" => self.class.wcif_type, "level" => self.level }
    end

    def ==(other)
      other.class == self.class && other.to_wcif == self.to_wcif
    end

    def hash
      self.to_wcif.hash
    end

    def self.load(json)
      if json.nil? || json.is_a?(self)
        json
      else
        json_obj = json.is_a?(Hash) ? json : JSON.parse(json)
        wcif_type = json_obj['type']
        Utils.advancement_condition_class_from_wcif_type(wcif_type).new(json_obj['level'])
      end
    end

    def self.dump(cutoff)
      cutoff ? JSON.dump(cutoff.to_wcif) : nil
    end

    def self.wcif_json_schema
      {
        "type" => %w[object null],
        "properties" => {
          "type" => { "type" => "string", "enum" => Utils::ALL_ADVANCEMENT_CONDITIONS.map(&:wcif_type) },
          "level" => { "type" => "integer" },
        },
      }
    end

    # Our Regulations allow at most 75% of competitors to proceed
    def regulations_boundary(results)
      (results.count * 0.75).floor
    end

    def max_qualifying(results)
      [max_advancing(results), regulations_boundary(results)].min
    end

    # Make sure you always pass the full results to this method,
    # otherwise the qualifying conditions will not be applied correctly
    def apply(full_results)
      qualifying_rank = max_qualifying(full_results)

      top_qualifying = full_results.first(qualifying_rank)

      return [] if top_qualifying.empty?

      cutoff = top_qualifying.last.potential_solve_time
      # Since full_results is already sorted, ties at the boundary
      # will be adjacent — walk forward and include any that match exactly.
      remaining = full_results.drop(qualifying_rank)
      tied_at_boundary = remaining.take_while { it.potential_solve_time == cutoff }
      with_ties = top_qualifying + tied_at_boundary
      # If the ties exceed the 75% rule, none of the tied results proceed
      advancing_with_ties = if with_ties.length > regulations_boundary(full_results)
                              top_qualifying.reject { it.potential_solve_time == cutoff }
                            else
                              with_ties
                            end

      # Filter out potential results
      advancing_with_ties.reject(&:empty_result?).pluck(:id)
    end
  end
end
