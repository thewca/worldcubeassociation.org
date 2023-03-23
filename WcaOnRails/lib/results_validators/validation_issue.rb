# frozen_string_literal: true

module ResultsValidators
  class ValidationIssue
    attr_reader :kind, :competition_id
    def initialize(kind, competition_id, message, **message_args)
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
