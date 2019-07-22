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
      other.class == self.class && other.state == state
    end

    def state
      [@kind, @competition_id, @message, @args]
    end
  end

  class ValidationError < ValidationIssue
  end

  class ValidationWarning < ValidationIssue
  end
end
