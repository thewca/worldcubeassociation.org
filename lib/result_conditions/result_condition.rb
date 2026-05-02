# frozen_string_literal: true

module ResultConditions
  class ResultCondition
    include ActiveModel::API
    include ActiveModel::Validations
    include ActiveModel::Attributes

    def self.load(json_obj)
      if json_obj.nil? || json_obj.is_a?(self)
        json_obj
      else
        wcif_type = json_obj['type']
        model_attributes = json_obj.except('type')
        Utils.result_condition_class_from_wcif_type(wcif_type).new(**model_attributes)
      end
    end

    def self.dump(result_condition)
      return unless result_condition

      result_condition.to_wcif
    end

    def to_wcif
      self.attributes.reverse_merge("type" => self.class.wcif_type)
    end

    def self.wcif_json_schema
      {
        "oneOf" => [
          # For (very) historic records, we do not have advancement condition data
          #   even though (from a schema standpoint) we _technically_ should.
          # Backfilling is too complicated and sometimes even impossible, so just accept NULL.
          { "type" => "null" },
          {
            "type" => "object",
            "properties" => {
              "type" => { "const" => "resultAchieved" },
              "scope" => { "type" => "string", "enum" => %w[single average] },
              "value" => { "type" => %w[integer null] },
            },
          },
          {
            "type" => "object",
            "properties" => {
              "type" => { "const" => "ranking" },
              "scope" => { "type" => "string", "enum" => %w[single average] },
              "value" => { "type" => "integer" },
            },
          },
          {
            "type" => "object",
            "properties" => {
              "type" => { "const" => "percent" },
              "scope" => { "type" => "string", "enum" => %w[single average] },
              "value" => { "type" => "integer" },
            },
          },
        ],
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
      advancing_with_ties.reject(&:empty_result?)
    end
  end
end
