# frozen_string_literal: true

module ResultsValidators
  class ValidationIssue
    attr_reader :kind, :competition_id

    def initialize(id, kind, competition_id, **message_args)
      @id = id
      @kind = kind
      @args = message_args
      @competition_id = competition_id
    end

    def to_s
      I18n.t("validators.#{@kind}.#{@id}", **@args, locale: 'en')
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
