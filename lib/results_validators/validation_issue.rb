# frozen_string_literal: true

module ResultsValidators
  class ValidationIssue
    # Maintain the list in alphabetical order. This is to easily identify if a duplicate is added.
    # Since this is not rails model, we need to manually maintain the uniqueness of the keys.
    VALIDATION_TYPES_KEYS = [
      :dob_jan_one,
      :dob_too_old,
      :dob_too_young,
    ].freeze

    VALIDATION_TYPES = VALIDATION_TYPES_KEYS.each_with_object({}) do |key, hash|
      hash[key] = key.to_s
    end.freeze

    attr_reader :kind, :competition_id
    def initialize(id, kind, competition_id, message, **message_args)
      @id = id
      @message = message
      @kind = kind
      @args = message_args
      @competition_id = competition_id
    end

    def to_s
      format(@message, @args)
    end

    def ==(other)
      other.class == self.class && other.hash == hash
    end

    def hash
      [@kind, @competition_id, @message, @args].hash
    end

    def eql?(other)
      self == other
    end
  end
end
