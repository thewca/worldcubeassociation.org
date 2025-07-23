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
  end
end
