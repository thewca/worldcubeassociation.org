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

    def apply(results_with_potential)
      qualifying_index = max_qualifying(results_with_potential)

      top_qualifying = results_with_potential.first(qualifying_index)

      advancing_with_ties = if top_qualifying.any?
                              cutoff = top_qualifying.last.potential_solve_time
                              # Since results_with_potential is already sorted, ties at the boundary
                              # will be adjacent — walk forward and include any that match exactly.
                              remaining = results_with_potential.drop(qualifying_index)
                              tied_at_boundary = remaining.take_while { |r| r.potential_solve_time == cutoff }
                              with_ties = top_qualifying + tied_at_boundary
                              # If the ties exceed the 75% rule, none of the tied results proceed, so we need to remove the last qualifier
                              with_ties.length > regulations_boundary(results_with_potential) ? top_qualifying.tap(&:pop) : with_ties
                            else
                              []
                            end

      [advancing_with_ties.select(&:complete?).pluck(:id), qualifying_index]
    end
  end
end
