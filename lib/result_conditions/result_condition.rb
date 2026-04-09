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

      result_condition.attributes.reverse_merge(type: result_condition.class.wcif_type)
    end

    def self.wcif_json_schema
      {
        "allOf" => [
          {
            "type" => "object",
            "properties" => {
              "type" => { "type" => "string", "enum" => Utils::ALL_RESULT_CONDITIONS.map(&:wcif_type) },
            },
          },
          {
            "oneOf" => [
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
          },
        ],
      }
    end
  end
end
