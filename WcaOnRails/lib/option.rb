module Option
  def self.from_nilable(x)
    x ? Some.new(x) : None.new
  end

  class Some
    def initialize(value)
      @value = value
    end

    def map
      Some.new(yield @value)
    end

    def unwrap_or(_)
      @value
    end
  end

  class None
    def map
      self
    end

    def unwrap_or(default)
      default
    end
  end
end
