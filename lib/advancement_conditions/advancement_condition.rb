# frozen_string_literal: true

module AdvancementConditions
  class AdvancementCondition
    include ActiveModel::Validations

    attr_accessor :level
    validates :level, numericality: { only_integer: true }

    @@advancement_conditions = [AttemptResultCondition, PercentCondition, RankingCondition].freeze

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

    def self.wcif_type_to_class
      @@wcif_type_to_class ||= @@advancement_conditions.to_h { |cls| [cls.wcif_type, cls] }
    end

    def self.load(json)
      if json.nil? || json.is_a?(self)
        json
      else
        json_obj = json.is_a?(Hash) ? json : JSON.parse(json)
        wcif_type = json_obj['type']
        self.wcif_type_to_class[wcif_type].new(json_obj['level'])
      end
    end

    def self.dump(cutoff)
      cutoff ? JSON.dump(cutoff.to_wcif) : nil
    end

    def self.wcif_json_schema
      {
        "type" => ["object", "null"],
        "properties" => {
          "type" => { "type" => "string", "enum" => @@advancement_conditions.map(&:wcif_type) },
          "level" => { "type" => "integer" },
        },
      }
    end
  end
end
